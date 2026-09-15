import { ERealtimeAction } from "../enums/realtime-action";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeActionOptions } from "../interfaces/realtime-action-options";
import { XanoRealtimeChannelOptions } from "../interfaces/realtime-channel-options";
import { XanoRealtimeClient } from "./realtime-client";
export declare class XanoRealtimeChannel {
    readonly channel: string;
    readonly options: Partial<XanoRealtimeChannelOptions>;
    private readonly config;
    /** Retry budget for a join refused by the v2 auth_pending guard. */
    private static readonly JOIN_MAX_ATTEMPTS;
    private static readonly JOIN_RETRY_MS;
    /**
     * The tier's refusal for a frame that beat the handshake. Matched as a
     * substring because it arrives as a plain error frame with no code.
     */
    private static readonly JOIN_NOT_READY;
    private observed;
    private offlineMessageQueue;
    private presenceCache;
    /** Cleared on every disconnect so a reconnect re-proves the join landed. */
    private joinAcknowledged;
    /**
     * The join awaiting acknowledgement, retained so a refusal can re-send it.
     * Null whenever there is nothing outstanding to retry.
     */
    private pendingJoin;
    private socketObserver;
    private onFuncs;
    private realtimeObserver;
    constructor(channel: string, options: Partial<XanoRealtimeChannelOptions>, config: XanoClientConfig);
    /** The tier confirmed this channel is joined; stops the join retry. */
    private markJoinAcknowledged;
    private handleConnectionUpdate;
    /**
     * Send the join, re-sending only if the v2 tier explicitly REFUSES it.
     *
     * A v2 handshake builds an ApplicationContext AFTER the socket opens, and any
     * frame arriving before that is refused with "Connection is not ready" — the
     * `auth_pending` guard. The refusal is a normal error frame, not a close, so
     * an un-retried join is simply LOST and the channel stays silently unjoined:
     * the socket looks healthy while no messages ever arrive. That is most likely
     * precisely on the reconnect path, where the app is not there to re-issue it.
     *
     * The retry is driven by that refusal and NOT by a timer, because the tier
     * exposes no ready signal and the handshake has no bounded duration — its own
     * harness simply sleeps 900ms before sending anything. A timer shorter than
     * the handshake re-sends a join that was merely in flight, and a duplicate
     * join is expensive rather than idempotent: it re-runs the channel's join
     * trigger, re-sends the presence snapshot, re-fires presence_join, and
     * replays the conversation transcript and the at-least-once gap a second time
     * — straight into the app's message handler, with no `replayed` marker to
     * filter the duplicates by. Waiting for the refusal costs nothing on the
     * happy path and cannot duplicate a join that the tier accepted.
     *
     * v1 has no such guard, so this only retries for v2.
     */
    private sendJoin;
    /**
     * Re-send a join the tier refused with the `auth_pending` guard.
     *
     * Ignores any other error frame: a refused join is the only error this can
     * fix, and re-sending on e.g. an authorization failure would just repeat it.
     */
    private handleJoinRefused;
    private retryJoinIfUnacknowledged;
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