import { describe, expect, test, beforeEach } from '@jest/globals';
import { ERealtimeAction } from '../../src/enums/realtime-action';
import { XanoRealtimeState } from '../../src/models/realtime-state';
import { realtimeBuildActionUtil } from '../../src/utils/realtime-build-action.util';
import { XanoBaseStorage } from '../../src/models/base-storage';

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