import { ERealtimeAction } from "../enums/realtime-action";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeActionOptions } from "../interfaces/realtime-action-options";
import { XanoRealtimeChannelOptions } from "../interfaces/realtime-channel-options";
import { XanoRealtimeClient } from "./realtime-client";
export declare class XanoRealtimeChannel {
    readonly channel: string;
    readonly options: Partial<XanoRealtimeChannelOptions>;
    private readonly config;
    /**
     * How often a join requested before the socket is ready checks again. A
     * channel with an `on()` handler does not need it: it joins from the
     * `connected` status, which is announced the moment the socket is ready. A
     * channel with no handler never sees that status, and depends on this.
     */
    private static readonly JOIN_RETRY_MS;
    private observed;
    private offlineMessageQueue;
    private presenceCache;
    /**
     * The socket this channel's join was sent on. A join goes out at most once
     * per socket, and a new socket (after a reconnect) gets its own.
     */
    private joinSentOn;
    /** The pending re-check for a join requested before the socket was ready. */
    private joinTimer;
    private socketObserver;
    private onFuncs;
    private realtimeObserver;
    constructor(channel: string, options: Partial<XanoRealtimeChannelOptions>, config: XanoClientConfig);
    private handleConnectionUpdate;
    /**
     * Send this channel's join on the current socket: once, and only when the
     * socket is ready.
     *
     * On v2 a frame sent before the tier has authenticated the socket is refused
     * with "Connection is not ready" and dropped, so a join sent too early is
     * lost and the channel stays silently unjoined: the socket looks healthy and
     * no messages ever arrive. XanoRealtimeState pings the tier until it answers
     * and only then reports the socket ready (see isReady()), so a join sent
     * after that is never refused this way.
     *
     * Re-sending the join when it is refused does not work instead. The refusal
     * names no channel, so with several channels one channel's refusal also
     * reaches a channel whose join was accepted and re-sends that one. And the
     * refusals come back within a round trip, so a count-bounded retry (this
     * used to stop after five) is used up long before a slow handshake ends.
     *
     * Once per socket, because a duplicate join is not harmless: it re-runs the
     * channel's join trigger, re-sends the presence snapshot, re-fires
     * presence_join, and replays the conversation transcript and the
     * at-least-once gap a second time, straight into the app's message handler.
     * Several paths ask for the join on the same socket: the constructor, the
     * `connected` status, the last status replayed to a new `on()` observer, and
     * the re-check timer below. Only the first one to find the socket ready
     * sends it.
     */
    private requestJoin;
    private clearJoinTimer;
    private handlePresenceUpdate;
    /**
     * v2 members are refcounted per IDENTITY, not per socket, so a member has no
     * socketId to match on — two tabs of one user collapse to a single entry.
     * Fall back to socketId so this stays correct for a v1 roster too.
     */
    private isSameMember;
    on(action: ERealtimeAction, onFunc: CallableFunction, onError?: CallableFunction): XanoRealtimeChannel;
    on(onFunc: CallableFunction, onError?: CallableFunction): XanoRealtimeChannel;
    destroy(): void;
    message(payload: any, actionOptions?: Partial<XanoRealtimeActionOptions>): void;
    private sendOrQueue;
    /**
     * Acknowledge a delivered message automatically, unless the app opted out.
     *
     * Waits for anything the handlers returned, so an `async` handler is acked
     * when its work COMPLETES rather than when it first awaits. A handler that
     * throws, or whose promise rejects, leaves the cursor unadvanced and the
     * message is redelivered on the next resumed join -- which is the behaviour
     * an at_least_once channel is chosen for.
     */
    private autoAck;
    /**
     * Advance this client's durable cursor on an `at_least_once` channel (v2).
     *
     * Called automatically for every delivered message, so an app only needs
     * this when it sets `manualAck` to defer acknowledgement past the handler --
     * e.g. until the message is persisted or a user has actually seen it.
     *
     * Only meaningful with a stable client_id: the cursor is stored against it,
     * and it is what bounds the replay after a resumed join.
     */
    ack(cursor: string): void;
    private processOfflineMessageQueue;
    getPresence(): XanoRealtimeClient[];
    /**
     * Request the channel's message history (v1 only).
     *
     * v2 has no `history` action: the frame falls through to the generic trigger
     * dispatch, throws, and comes back as `Internal error` — a server-side error
     * for a client-side mistake. So this no-ops there, the mirror image of
     * `ack()` no-opping on v1. v2's equivalent is the join-time transcript
     * replay, enabled by the channel's `history` option.
     */
    history(): void;
}
//# sourceMappingURL=realtime-channel.d.ts.map