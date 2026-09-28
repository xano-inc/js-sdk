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

describe('realtime v2 readiness and join', () => {
  // A v2 tier refuses EVERY frame that arrives before it has authenticated the
  // socket with a channel-less `{action:"error", payload:{message:"Connection
  // is not ready"}}`, and drops it. It answers `ping` with `pong` only once the
  // socket is authenticated (x2 Handlers.php and client-go dispatch.go both put
  // the guard before the ping). The fake tier below models exactly that, so
  // these tests drive the real XanoRealtimeState socket code end to end.
  const NOT_READY = 'Connection is not ready';

  type Received = { t: number; frame: any };

  class FakeWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = 0;
    openedAt = 0;
    sent: Received[] = [];
    private listeners: Record<string, ((ev: any) => void)[]> = {};

    constructor(public url: string, public protocols?: any) {
      sockets.push(this);
    }

    addEventListener(type: string, fn: (ev: any) => void) {
      (this.listeners[type] = this.listeners[type] || []).push(fn);
    }

    fire(type: string, ev: any = {}) {
      for (const fn of this.listeners[type] || []) fn(ev);
    }

    send(data: string) {
      // A browser throws InvalidStateError here; so does the `ws` package.
      if (this.readyState !== FakeWebSocket.OPEN) {
        throw new Error('InvalidStateError: the socket is not open');
      }
      const frame = JSON.parse(data);
      this.sent.push({ t: Date.now(), frame });
      tier.receive(this, frame);
    }

    close(code = 1000) {
      if (this.readyState === FakeWebSocket.CLOSED) return;
      this.readyState = FakeWebSocket.CLOSED;
      // Close events are asynchronous in a browser.
      setTimeout(() => this.fire('close', { code }), 0);
    }
  }

  let sockets: FakeWebSocket[] = [];

  // The tier: frames arriving before `readyAfterMs` (measured from open) are
  // refused; after that a ping is ponged and a join is accepted and acked.
  // Every answer takes `rttMs`; a join ack takes `joinAckMs`.
  const tier = {
    readyAfterMs: 0,
    rttMs: 1,
    joinAckMs: 1,
    refused: [] as any[],
    accepted: [] as any[],
    /** Frames to answer the next pings with instead of the normal answer. */
    pingAnswers: [] as any[],
    reset() {
      this.readyAfterMs = 0;
      this.rttMs = 1;
      this.joinAckMs = 1;
      this.refused = [];
      this.accepted = [];
      this.pingAnswers = [];
    },
    answer(ws: FakeWebSocket, frame: any, afterMs: number) {
      setTimeout(() => {
        if (ws.readyState === FakeWebSocket.OPEN) {
          ws.fire('message', { data: JSON.stringify(frame) });
        }
      }, afterMs);
    },
    receive(ws: FakeWebSocket, frame: any) {
      if (frame.action === 'ping' && this.pingAnswers.length > 0) {
        this.answer(ws, this.pingAnswers.shift(), this.rttMs);
        return;
      }

      if (Date.now() - ws.openedAt < this.readyAfterMs) {
        this.refused.push(frame);
        this.answer(ws, { action: 'error', payload: { message: NOT_READY } }, this.rttMs);
        return;
      }

      if (frame.action === 'ping') {
        this.answer(ws, { action: 'pong' }, this.rttMs);
        return;
      }

      this.accepted.push({ ws, frame });
      if (frame.action === 'join') {
        this.answer(
          ws,
          { action: 'join', channel: frame.options.channel, payload: { resumed: false } },
          this.joinAckMs
        );
      }
    },
  };

  const openSocket = (ws: FakeWebSocket) => {
    ws.readyState = FakeWebSocket.OPEN;
    ws.openedAt = Date.now();
    ws.fire('open');
  };

  const serverClose = (ws: FakeWebSocket, code: number) => {
    ws.readyState = FakeWebSocket.CLOSED;
    ws.fire('close', { code });
  };

  const sentActions = (ws: FakeWebSocket) => ws.sent.map((s) => s.frame.action);
  const acceptedJoins = (channel?: string) =>
    tier.accepted.filter(
      (a) => a.frame.action === 'join' && (!channel || a.frame.options.channel === channel)
    );
  const sentJoins = (ws: FakeWebSocket) =>
    ws.sent.filter((s) => s.frame.action === 'join');

  const channels: XanoRealtimeChannel[] = [];
  let previousWebSocket: any;

  const makeChannel = (name: string, cfg: any, options: any = {}) => {
    const ch = new XanoRealtimeChannel(name, options, cfg);
    channels.push(ch);
    return ch;
  };

  const v2 = (extra: any = {}) => config({ realtimeVersion: 2, realtimeClientId: 'c1', ...extra });

  beforeEach(() => {
    jest.useFakeTimers();
    previousWebSocket = (<any>global).WebSocket;
    (<any>global).WebSocket = FakeWebSocket;
    sockets = [];
    tier.reset();
  });

  afterEach(() => {
    for (const ch of channels.splice(0)) {
      // Teardown must reach the reset below whatever state a test left behind.
      // (Before DEV-8191, destroy() on a socket that had not opened threw.)
      try {
        ch.destroy();
      } catch (e) {
        // The destroy() test covers this behaviour.
      }
    }
    jest.runOnlyPendingTimers();

    // XanoRealtimeState is a process-wide singleton; put it back as found.
    const state: any = XanoRealtimeState.getInstance();
    state.socket = null;
    state.readySocket = null;
    state.socketObserver.observers = [];
    state.socketObserver.lastState = undefined;
    state.reconnectSettings.reconnecting = false;
    state.reconnectSettings.reconnectInterval = 1000;

    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    (<any>global).WebSocket = previousWebSocket;
  });

  test('constructing a channel does not clobber the v2 config', () => {
    // Regression: `socketObserver`'s field initializer called
    // `setConfig(this.config)` BEFORE the constructor assigned its parameter
    // properties, storing undefined. `isV2()` then answered false on a v2
    // client, which omitted `client_id` from the join -- silently disabling
    // resume.
    makeChannel('lobby', v2()).on(() => undefined);
    expect(XanoRealtimeState.getInstance().isV2()).toBe(true);
  });

  test('a join survives a handshake far longer than five round trips (DEV-8191)', () => {
    // The reported bug: the join was sent at open and re-sent on each refusal,
    // back to back, five times. Five refusals take five round trips (ms), so on
    // a 500ms handshake the join was used up and lost, and the channel stayed
    // silently unjoined.
    tier.readyAfterMs = 500;
    tier.rttMs = 2;
    const handler = jest.fn();
    makeChannel('lobby', v2()).on(handler);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('lobby')).toHaveLength(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'join', channel: 'lobby' })
    );
  });

  test('nothing but readiness pings is sent before the tier is ready', () => {
    // Anything else would be refused and dropped. It also keeps the ping's
    // answer unambiguous: no other frame can draw a not-ready refusal.
    tier.readyAfterMs = 500;
    tier.rttMs = 2;
    makeChannel('lobby', v2()).on(() => undefined);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    const firstJoin = sentJoins(sockets[0])[0];
    const beforeJoin = sockets[0].sent.filter((s) => s.t < firstJoin.t);
    expect(beforeJoin.length).toBeGreaterThan(0);
    expect(beforeJoin.every((s) => s.frame.action === 'ping')).toBe(true);
    expect(tier.refused.every((f) => f.action === 'ping')).toBe(true);
    expect(firstJoin.t - sockets[0].openedAt).toBeGreaterThanOrEqual(500);
  });

  test('the join is sent exactly once, and carries the client_id resume is keyed on', () => {
    tier.readyAfterMs = 300;
    makeChannel('lobby', v2()).on(() => undefined);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(10000);

    expect(sentJoins(sockets[0])).toHaveLength(1);
    expect(sentJoins(sockets[0])[0].frame.options.client_id).toEqual('c1');
  });

  test('there is no deadline: a 30s handshake still joins, and pings back off to 1s', () => {
    tier.readyAfterMs = 30000;
    makeChannel('lobby', v2()).on(() => undefined);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(31500);

    expect(acceptedJoins('lobby')).toHaveLength(1);
    const pings = sentActions(sockets[0]).filter((a) => a === 'ping');
    // 100ms apart for the first second, then 200, 400, 800, and 1000ms apart:
    // about 42 pings over 30s, where a fixed 100ms interval would send 300.
    expect(pings.length).toBeLessThan(50);
    const gaps = sockets[0].sent
      .filter((s) => s.frame.action === 'ping')
      .map((s, i, all) => (i ? s.t - all[i - 1].t : 0))
      .slice(1);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(1000 + 2);
    expect(gaps[0]).toBeLessThan(150);
  });

  test('a handshake that ends within the first second is noticed within about 100ms', () => {
    tier.readyAfterMs = 750;
    makeChannel('lobby', v2()).on(() => undefined);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('lobby')).toHaveLength(1);
    expect(sentJoins(sockets[0])).toHaveLength(1);
    const join = sentJoins(sockets[0])[0];
    expect(join.t - sockets[0].openedAt).toBeGreaterThanOrEqual(750);
    expect(join.t - sockets[0].openedAt).toBeLessThan(750 + 100 + 10);
  });

  test('a ping answered with some other connection-level error still reaches the app, and pinging goes on', () => {
    // Were only the not-ready refusal counted as an answer, this ping would
    // stay outstanding forever and the socket would never be reported ready.
    tier.pingAnswers = [{ action: 'error', payload: { message: 'Internal error' } }];
    const onError = jest.fn();
    makeChannel('lobby', v2()).on(() => undefined, onError);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { message: 'Internal error' } })
    );
    expect(acceptedJoins('lobby')).toHaveLength(1);
  });

  test('a refused handshake reaches the app once, not followed by the ping\'s not-ready answer', () => {
    // The tier pushes the refusal reason unasked, then closes 4401. The ping
    // already in flight is answered "not ready" in between. Pairing frames with
    // pings took the reason as the ping's answer and passed the real answer on.
    tier.rttMs = 5;
    tier.readyAfterMs = 10000;
    const onError = jest.fn();
    makeChannel('lobby', v2()).on(() => undefined, onError);
    openSocket(sockets[0]);

    sockets[0].fire('message', {
      data: JSON.stringify({ action: 'error', payload: { message: 'Unknown connection hash' } }),
    });
    jest.advanceTimersByTime(5);
    serverClose(sockets[0], 4401);
    jest.advanceTimersByTime(3000);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { message: 'Unknown connection hash' } })
    );
  });

  test('a pong answering a ping still in flight after the socket is ready is dropped', () => {
    // A connection-level error before ready sends a second ping while the
    // first is still in flight, so two pongs come back.
    tier.rttMs = 300;
    const handler = jest.fn();
    makeChannel('lobby', v2()).on(handler);
    openSocket(sockets[0]);
    sockets[0].fire('message', {
      data: JSON.stringify({ action: 'error', payload: { message: 'Internal error' } }),
    });

    jest.advanceTimersByTime(3000);

    expect(sentActions(sockets[0]).filter((a) => a === 'ping')).toHaveLength(2);
    expect(handler).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'pong' }));
    expect(acceptedJoins('lobby')).toHaveLength(1);
  });

  test('a burst of connection-level errors does not multiply the pings', () => {
    tier.readyAfterMs = 10000;
    tier.rttMs = 50;
    makeChannel('lobby', v2()).on(() => undefined, () => undefined);
    openSocket(sockets[0]);
    for (let i = 0; i < 5; i++) {
      sockets[0].fire('message', {
        data: JSON.stringify({ action: 'error', payload: { message: 'Internal error' } }),
      });
    }

    jest.advanceTimersByTime(120);

    // The one sent at open, and one more after the pause.
    expect(sentActions(sockets[0]).filter((a) => a === 'ping')).toHaveLength(2);
  });

  test('an error thrown by a connection_status handler is not swallowed', () => {
    // v1 announces `connected` from the open listener, where a throw surfaces.
    // On v2 it is announced from the message listener, whose catch is silent.
    makeChannel('lobby', v2()).on('connection_status', () => {
      throw new Error('handler boom');
    });
    openSocket(sockets[0]);

    expect(() => jest.advanceTimersByTime(3000)).toThrow('handler boom');
  });

  test('whether to ping is decided with the socket, not re-read at open', () => {
    // Every channel constructor calls setConfig(), so a second client with
    // another realtimeVersion can change the config while a socket connects.
    makeChannel('lobby', v2()).on(() => undefined);
    XanoRealtimeState.getInstance().setConfig(config({}));
    openSocket(sockets[0]);

    expect(sockets[0].url).toContain('/ws/');
    expect(sentActions(sockets[0])[0]).toEqual('ping');
  });

  test('the app sees neither the pings\' answers nor the tier\'s refusals of them', () => {
    tier.readyAfterMs = 500;
    const handler = jest.fn();
    const onError = jest.fn();
    makeChannel('lobby', v2()).on(handler, onError);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    expect(tier.refused.length).toBeGreaterThan(0);
    expect(onError).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'pong' }));
  });

  test('on v2 `connected` is reported when the tier is ready, not when the socket opens', () => {
    tier.readyAfterMs = 500;
    const statuses: { t: number; status: string }[] = [];
    const opened = Date.now();
    makeChannel('lobby', v2()).on('connection_status', (a: any) =>
      statuses.push({ t: Date.now() - opened, status: a.payload.status })
    );
    openSocket(sockets[0]);

    jest.advanceTimersByTime(200);
    expect(statuses).toEqual([]);

    jest.advanceTimersByTime(2000);
    expect(statuses.map((s) => s.status)).toEqual(['connected']);
    expect(statuses[0].t).toBeGreaterThanOrEqual(500);
  });

  test('v1 needs no pings: `connected` and the join at open', () => {
    const statuses: string[] = [];
    makeChannel('lobby', config({})).on('connection_status', (a: any) =>
      statuses.push(a.payload.status)
    );
    openSocket(sockets[0]);

    expect(statuses).toEqual(['connected']);
    expect(sentActions(sockets[0])).toEqual(['join']);
    expect(sockets[0].url).toContain('/rt/');

    jest.advanceTimersByTime(5000);
    expect(sentActions(sockets[0])).toEqual(['join']);
  });

  test('v1: a channel created just after the socket opens joins once', () => {
    // Same replayed-`connected` duplicate as on v2.
    tier.joinAckMs = 100000;
    makeChannel('lobby', config({})).on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);

    makeChannel('general', config({})).on(() => undefined);
    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('general')).toHaveLength(1);
  });

  test('v1: a channel with no handler created while the socket is opening joins', () => {
    makeChannel('lobby', config({})).on(() => undefined);
    makeChannel('general', config({}));
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('general')).toHaveLength(1);
  });

  test('two channels each join once, however the refusals and acks interleave', () => {
    // The refusal names no channel, so every channel sees every refusal. When
    // the join was re-sent on a refusal, a refusal of one channel's join also
    // re-sent the other channel's, even one the tier had already accepted.
    // Here both joins are refused, the tier is ready by the time the two
    // refusals come back, and each refusal re-sent BOTH joins: two each.
    tier.readyAfterMs = 1;
    tier.rttMs = 1;
    tier.joinAckMs = 250;
    makeChannel('lobby', v2()).on(() => undefined);
    makeChannel('general', v2()).on(() => undefined);
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('lobby')).toHaveLength(1);
    expect(acceptedJoins('general')).toHaveLength(1);
  });

  test('a channel created after the socket is ready joins once', () => {
    // Its constructor joins, and `on()` then replays the last status -- the
    // `connected` -- to its new observer, which asked for the join again.
    // No frame arrives between `connected` and the join ack, so the last
    // status is still `connected` when the second channel subscribes.
    tier.joinAckMs = 1000;
    makeChannel('lobby', v2()).on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);

    const later = makeChannel('general', v2());
    later.on(() => undefined);
    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('general')).toHaveLength(1);
  });

  test('a channel created while the socket is still connecting joins once', () => {
    // Its constructor finds a socket that is not open yet and re-checks on a
    // timer; the `connected` status also asks. Only one of them may send.
    tier.joinAckMs = 1000;
    makeChannel('lobby', v2()).on(() => undefined);
    makeChannel('general', v2()).on(() => undefined);

    jest.advanceTimersByTime(600);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(5000);

    expect(acceptedJoins('general')).toHaveLength(1);
  });

  test('a channel created after the socket opens, but before it is ready, waits for it', () => {
    // Its constructor finds an OPEN socket. Open is not enough on v2.
    tier.readyAfterMs = 500;
    makeChannel('lobby', v2()).on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);

    makeChannel('general', v2()).on(() => undefined);
    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('general')).toHaveLength(1);
    expect(tier.refused.every((f) => f.action === 'ping')).toBe(true);
  });

  test('a channel with no handler still joins once the socket is ready', () => {
    // It never observes `connected`, so the constructor's re-check is its only
    // way to join.
    tier.readyAfterMs = 300;
    makeChannel('lobby', v2()).on(() => undefined);
    makeChannel('general', v2());
    openSocket(sockets[0]);

    jest.advanceTimersByTime(3000);

    expect(acceptedJoins('general')).toHaveLength(1);
  });

  test('after a reconnect the new socket is checked again, and the channel re-joins once', () => {
    tier.readyAfterMs = 200;
    makeChannel('lobby', v2()).on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(1000);
    expect(acceptedJoins('lobby')).toHaveLength(1);

    serverClose(sockets[0], 1006);
    jest.advanceTimersByTime(1000); // reconnect backoff
    expect(sockets).toHaveLength(2);

    openSocket(sockets[1]);
    jest.advanceTimersByTime(3000);

    const second = sentJoins(sockets[1]);
    expect(second).toHaveLength(1);
    expect(second[0].frame.options.client_id).toEqual('c1');
    expect(tier.refused.every((f) => f.action === 'ping')).toBe(true);
  });

  test('an answer arriving on a replaced socket does not mark the new one ready', () => {
    tier.readyAfterMs = 10000;
    tier.rttMs = 50;
    const statuses: string[] = [];
    makeChannel('lobby', v2()).on('connection_status', (a: any) => statuses.push(a.payload.status));
    openSocket(sockets[0]);
    jest.advanceTimersByTime(5);

    const old = sockets[0];
    serverClose(old, 1006);
    jest.advanceTimersByTime(1000);
    openSocket(sockets[1]);

    // The dead socket's ping is still outstanding; its pong turns up late.
    old.fire('message', { data: JSON.stringify({ action: 'pong' }) });
    expect(statuses).toEqual(['disconnected']);
    expect(XanoRealtimeState.getInstance().isReady()).toBe(false);
    expect(sentJoins(sockets[1])).toHaveLength(0);
  });

  test('message() before the socket is ready is queued and sent after the join', () => {
    tier.readyAfterMs = 500;
    const ch = makeChannel('lobby', v2(), { queueOfflineActions: true, messageType: 'say' });
    ch.on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(100);

    ch.message({ text: 'early' });
    jest.advanceTimersByTime(3000);

    const actions = sentActions(sockets[0]).filter((a) => a !== 'ping');
    expect(actions).toEqual(['join', 'broadcast']);
    expect(tier.refused.every((f) => f.action === 'ping')).toBe(true);
  });

  test('message() before the socket is ready without queueing is not sent into the refusal', () => {
    tier.readyAfterMs = 500;
    const ch = makeChannel('lobby', v2(), { messageType: 'say' });
    ch.on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(100);

    ch.message({ text: 'early' });
    jest.advanceTimersByTime(3000);

    expect(tier.refused.every((f) => f.action === 'ping')).toBe(true);
  });

  test('destroy() before the socket is ready sends no leave and cancels the join', () => {
    tier.readyAfterMs = 500;
    makeChannel('lobby', v2()).on(() => undefined);
    const doomed = makeChannel('general', v2());
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);

    doomed.destroy();
    jest.advanceTimersByTime(3000);

    expect(sentActions(sockets[0])).not.toContain('leave');
    expect(acceptedJoins('general')).toHaveLength(0);
    expect(acceptedJoins('lobby')).toHaveLength(1);
  });

  test('an unrelated error still reaches the app, and does not re-send the join', () => {
    makeChannel('lobby', v2()).on(() => undefined);
    const onError = jest.fn();
    const ch = makeChannel('general', v2());
    ch.on(() => undefined, onError);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);

    sockets[0].fire('message', {
      data: JSON.stringify({ action: 'error', channel: 'general', payload: { message: 'Unauthorized' } }),
    });
    jest.advanceTimersByTime(3000);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { message: 'Unauthorized' } })
    );
    expect(sentJoins(sockets[0]).filter((s) => s.frame.options.channel === 'general')).toHaveLength(1);
  });

  test('while a ping is outstanding, an error naming a channel is not taken as its answer', () => {
    // The tier's not-ready refusal never names a channel; anything that does
    // is about that channel and belongs to the app.
    tier.readyAfterMs = 500;
    tier.rttMs = 50;
    const onError = jest.fn();
    makeChannel('lobby', v2()).on(() => undefined, onError);
    openSocket(sockets[0]);

    sockets[0].fire('message', {
      data: JSON.stringify({ action: 'error', channel: 'lobby', payload: { message: NOT_READY } }),
    });

    expect(onError).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(3000);
    expect(acceptedJoins('lobby')).toHaveLength(1);
  });

  test('a manual ack() before the socket is ready is not sent', () => {
    // An app may ack a cursor it persisted earlier as soon as it connects.
    tier.readyAfterMs = 500;
    const ch = makeChannel('lobby', v2(), { manualAck: true });
    ch.on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);

    ch.ack('1788570346669-0');
    jest.advanceTimersByTime(3000);

    expect(sentActions(sockets[0])).not.toContain('ack');
    expect(tier.refused.every((f) => f.action === 'ping')).toBe(true);
  });

  test('messaging a roster member after a reconnect waits for the new socket to be ready', () => {
    tier.readyAfterMs = 200;
    const ch = makeChannel('lobby', v2());
    ch.on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(1000);
    sockets[0].fire('message', {
      data: JSON.stringify({
        action: 'presence_full',
        channel: 'lobby',
        payload: { members: [{ id: '7', socketId: 'abc' }] },
      }),
    });
    const member = ch.getPresence()[0];

    serverClose(sockets[0], 1006);
    jest.advanceTimersByTime(1000);
    openSocket(sockets[1]);
    jest.advanceTimersByTime(50);

    member.message({ text: 'hi' });
    member.history();
    jest.advanceTimersByTime(3000);

    expect(tier.refused.every((f) => f.action === 'ping')).toBe(true);
  });

  test('a stale `connected` replayed to a new observer does not flush its queue early', () => {
    // destroy()ing the last channel closes the socket without a
    // `disconnected` status, so the last status is still the old socket's
    // `connected`, and a channel that subscribes next is handed it. (No join
    // ack arrives in between, or that would be the last status instead.)
    tier.joinAckMs = 100000;
    const first = makeChannel('lobby', v2());
    first.on(() => undefined);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);
    first.destroy();
    jest.advanceTimersByTime(10);

    tier.readyAfterMs = 500;
    makeChannel('general', v2()).on(() => undefined);
    const queued = makeChannel('news', v2(), { queueOfflineActions: true, messageType: 'say' });
    queued.message({ text: 'early' });
    expect(() => queued.on(() => undefined)).not.toThrow();

    openSocket(sockets[1]);
    jest.advanceTimersByTime(3000);

    const actions = sockets[1].sent
      .filter((s) => s.frame.action !== 'ping')
      .filter((s) => s.frame.options?.channel === 'news')
      .map((s) => s.frame.action);
    expect(actions).toEqual(['join', 'broadcast']);
  });

  test('a not-ready refusal once the socket is ready is passed on to the app', () => {
    // Only a refusal before ready answers one of our pings. After that the
    // tier never refuses as not ready, so one means something is wrong.
    const onError = jest.fn();
    makeChannel('lobby', v2()).on(() => undefined, onError);
    openSocket(sockets[0]);
    jest.advanceTimersByTime(50);

    sockets[0].fire('message', {
      data: JSON.stringify({ action: 'error', payload: { message: NOT_READY } }),
    });

    expect(onError).toHaveBeenCalledTimes(1);
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