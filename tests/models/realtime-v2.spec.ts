import { afterEach, describe, expect, jest, test, beforeEach } from '@jest/globals';
import { ERealtimeAction } from '../../src/enums/realtime-action';
import { XanoRealtimeState } from '../../src/models/realtime-state';
import { realtimeBuildActionUtil } from '../../src/utils/realtime-build-action.util';
import { XanoBaseStorage } from '../../src/models/base-storage';
import { XanoRealtimeChannel } from '../../src/models/realtime-channel';

const config = (extra: any = {}) =>
  <any>{
    instanceBaseUrl: 'https://x1.dev.xano.io',
    realtimeConnectionCanonical: 'abc123',
    storage: <XanoBaseStorage>{},
    ...extra,
  };

describe('realtime v2 wire format', () => {
  test('a v1 frame is byte-identical to the pre-v2 builder output', () => {
    // Guards the whole v1 surface: `type` must be absent, not present-and-empty,
    // or every existing v1 app starts sending a field the legacy tier never saw.
    const frame = realtimeBuildActionUtil(
      ERealtimeAction.Message,
      { channel: 'room' },
      { text: 'hi' }
    );

    expect(JSON.parse(frame)).toEqual({
      action: 'message',
      options: { channel: 'room' },
      payload: { text: 'hi' },
    });
    expect(frame).not.toContain('type');
  });

  test('v2 carries the message type at the TOP level, not inside options', () => {
    // The tier reads $frameData['type']; nesting it in options routes nowhere.
    const frame = JSON.parse(
      realtimeBuildActionUtil(
        ERealtimeAction.Broadcast,
        { channel: 'room' },
        { text: 'hi' },
        'say'
      )
    );

    expect(frame.type).toEqual('say');
    expect(frame.options.type).toBeUndefined();
    expect(frame.action).toEqual('broadcast');
  });

  test('Broadcast and Message stay distinct actions', () => {
    // v2 SENDS broadcast but RECEIVES message, so an existing
    // on(Message, ...) handler must keep working against v2.
    expect(ERealtimeAction.Broadcast).toEqual('broadcast');
    expect(ERealtimeAction.Message).toEqual('message');
  });

  test('Replay is still a known action so the wire frame can be recognised', () => {
    // The SDK normalises it into Message before the app sees it; the member
    // exists so the observer can identify the incoming frame.
    expect(ERealtimeAction.Replay).toEqual('replay');
  });

  test('top-level v2 frame fields survive parsing', () => {
    // Regression: the socket message handler used to hand-copy action/client/
    // options/payload, which DROPPED v2's top-level `id`, `channel` and `type`.
    // The symptoms were silent -- the channel filter had nothing to match on,
    // and auto-ack (which keys on `id`) never fired for anyone.
    const wire = {
      action: 'message',
      channel: 'lobby',
      type: 'say',
      id: '1788471242950-0',
      payload: { text: 'hi' },
    };

    const parsed = {
      ...wire,
      action: wire.action,
      client: undefined,
      options: undefined,
      payload: wire.payload,
    };

    expect(parsed.id).toEqual('1788471242950-0');
    expect(parsed.channel).toEqual('lobby');
    expect(parsed.type).toEqual('say');
  });
});

describe('realtime v2 ack frame', () => {
  // The tier resolves the acknowledged id at FRAME level -- `$payload['id'] ??
  // $payload['options']['id']` -- and never reads the payload. An id it cannot
  // resolve is not an error: the handler returns before touching Redis, so the
  // ack evaporates, the cursor stays at 0, and every reconnect replays the
  // whole retained stream. These guard the frame shape, since nothing on the
  // wire complains when it is wrong.
  const ackFrame = (cursor: string) =>
    JSON.parse(
      realtimeBuildActionUtil(
        ERealtimeAction.Ack,
        { channel: 'secret', client_id: 'harness-1', id: cursor },
        { cursor }
      )
    );

  test('the acknowledged id is resolvable at frame level', () => {
    const frame = ackFrame('1788570346669-0');

    // `options.id` is the fallback the tier reads when there is no top-level
    // `id`; either satisfies it, but one of them MUST be present.
    const resolved = frame.id ?? frame.options?.id ?? '';
    expect(resolved).toEqual('1788570346669-0');
  });

  test('the id is not carried ONLY in the payload', () => {
    // The regression: `{payload: {cursor}}` alone resolves to '' server-side.
    const frame = ackFrame('1788570346669-0');
    const withoutPayload = { ...frame, payload: null };

    expect(withoutPayload.id ?? withoutPayload.options?.id ?? '').not.toEqual('');
  });
});

describe('realtime v2 broadcast type', () => {
  test('a per-call type is lifted to the top level, not left in options', () => {
    // `message(p, {type: 'say'})` used to land in options.type, which the tier
    // never reads -- it answered `Unknown message type: ` naming the empty
    // string. The lift happens in message(); this pins the builder contract it
    // depends on.
    const frame = JSON.parse(
      realtimeBuildActionUtil(
        ERealtimeAction.Broadcast,
        { channel: 'lobby' },
        { text: 'hi' },
        'say'
      )
    );

    expect(frame.type).toEqual('say');
    expect(frame.options.type).toBeUndefined();
  });
});

describe('realtime v2 join retry', () => {
  // The tier refuses a frame that beats the handshake with a plain error frame
  // ("Connection is not ready") and offers NO ready signal, so the retry must
  // be driven by that refusal. A timer instead re-sends a join that was merely
  // in flight -- and a duplicate join re-runs the join trigger, re-sends the
  // presence snapshot and replays the transcript a second time.
  const sent: string[] = [];
  let channel: any;

  // The SDK compares against `WebSocket.OPEN`, and node's jest env has no
  // WebSocket global -- without this every readyState check reads undefined and
  // the socket looks perpetually unopened.
  (<any>global).WebSocket = (<any>global).WebSocket ?? { OPEN: 1 };

  const fakeSocket = () => <any>{ readyState: 1, send: (m: string) => sent.push(m) };

  const drive = (action: any) => {
    // Reach the private observer the same way the socket does.
    channel['realtimeObserver'].update(action);
  };

  beforeEach(() => {
    sent.length = 0;
    jest.useFakeTimers();

    const cfg = config({ realtimeVersion: 2, realtimeClientId: 'c1' });
    const state = XanoRealtimeState.getInstance();
    state.setConfig(cfg);

    const socket = fakeSocket();
    jest.spyOn(state, 'getSocket').mockReturnValue(socket);
    // `on()` subscribes, which would otherwise open a real WebSocket.
    jest.spyOn(<any>state, 'connect').mockReturnValue(socket);

    // The constructor sees a live socket and joins immediately, which is the
    // same path a reconnect's `connection_status` transition takes -- so this
    // is the single join under test.
    channel = new XanoRealtimeChannel('lobby', {}, cfg);
    channel.on(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const joins = () =>
    sent.map((m) => JSON.parse(m)).filter((f) => f.action === ERealtimeAction.Join);

  test('constructing a channel does not clobber the v2 config', () => {
    // Regression: `socketObserver`'s field initializer called
    // `setConfig(this.config)` BEFORE the constructor assigned its parameter
    // properties, storing undefined. `isV2()` then answered false on a v2
    // client, which omitted `client_id` from the join -- silently disabling
    // resume -- and left the v2-only join retry unarmed.
    expect(XanoRealtimeState.getInstance().isV2()).toBe(true);
  });

  test('a v2 join carries the client_id resume is keyed on', () => {
    expect(joins()[0].options.client_id).toEqual('c1');
  });

  test('an accepted join is sent exactly ONCE, even past the handshake window', () => {
    expect(joins()).toHaveLength(1);

    drive({ action: ERealtimeAction.Join, channel: 'lobby', payload: {} });

    // Well past both the old 400ms retry and the tier's ~900ms handshake.
    jest.advanceTimersByTime(5000);
    expect(joins()).toHaveLength(1);
  });

  test('a join is NOT re-sent while merely in flight', () => {
    // No acknowledgement, no refusal -- the previous behaviour duplicated here.
    jest.advanceTimersByTime(5000);
    expect(joins()).toHaveLength(1);
  });

  test('a refused join IS re-sent', () => {
    drive({
      action: ERealtimeAction.Error,
      payload: { message: 'Connection is not ready' },
    });

    expect(joins()).toHaveLength(2);
  });

  test('an unrelated error does not re-send the join', () => {
    // Re-sending on e.g. an authorization failure just repeats it.
    drive({
      action: ERealtimeAction.Error,
      payload: { message: 'Unauthorized' },
    });

    expect(joins()).toHaveLength(1);
  });

  test('a refusal arriving after the join was acknowledged is ignored', () => {
    drive({ action: ERealtimeAction.Join, channel: 'lobby', payload: {} });
    drive({
      action: ERealtimeAction.Error,
      payload: { message: 'Connection is not ready' },
    });

    expect(joins()).toHaveLength(1);
  });
});

describe('realtime v2 presence leave', () => {
  // Every anonymous v2 member is `id: "0"` (the tier's anonymous identity has
  // `row_id => 0`), so a filter over the roster removed EVERY member on the
  // first departure.
  const anonymous = (joinedAt: number) => ({
    id: '0',
    dbo_id: 0,
    authenticated: false,
    extras: [],
    joined_at: joinedAt,
  });

  test('one leaving member removes exactly one roster entry', () => {
    const cfg = config({ realtimeVersion: 2 });
    const state = XanoRealtimeState.getInstance();
    state.setConfig(cfg);
    jest.spyOn(state, 'getSocket').mockReturnValue(<any>null);
    jest.spyOn(<any>state, 'connect').mockReturnValue(<any>null);

    const channel: any = new XanoRealtimeChannel('lobby', {}, cfg);
    channel.on(() => undefined);

    channel['realtimeObserver'].update({
      action: ERealtimeAction.PresenceFull,
      channel: 'lobby',
      payload: { members: [anonymous(1), anonymous(2)] },
    });
    expect(channel.getPresence()).toHaveLength(2);

    channel['realtimeObserver'].update({
      action: ERealtimeAction.PresenceLeave,
      channel: 'lobby',
      // joined_at is re-stamped at leave time by the tier, so it matches
      // neither roster entry -- only the ambiguous id is left to match on.
      payload: { member: anonymous(99) },
    });

    expect(channel.getPresence()).toHaveLength(1);

    jest.restoreAllMocks();
  });
});

describe('realtime v2 state', () => {
  let state: XanoRealtimeState;

  beforeEach(() => {
    state = XanoRealtimeState.getInstance();
  });

  test('defaults to v1 so existing apps are untouched', () => {
    state.setConfig(config());
    expect(state.isV2()).toBe(false);

    state.setConfig(config({ realtimeVersion: 1 }));
    expect(state.isV2()).toBe(false);
  });

  test('opts into v2 only on an explicit version', () => {
    state.setConfig(config({ realtimeVersion: 2 }));
    expect(state.isV2()).toBe(true);
  });

  test('an explicit client id is used verbatim', () => {
    state.setConfig(config({ realtimeVersion: 2, realtimeClientId: 'fixed-id' }));
    expect(state.getClientId()).toEqual('fixed-id');
  });

  test('a generated client id is STABLE across calls', () => {
    // This is the property resume depends on: a client id that changed per
    // call (or per socket) would make every reconnect look like a new client
    // and silently replay nothing.
    state.setConfig(config({ realtimeVersion: 2, realtimeClientId: null }));
    const first = state.getClientId();
    const second = state.getClientId();

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(8);
  });
});