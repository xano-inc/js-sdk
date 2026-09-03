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
    private observed;
    private offlineMessageQueue;
    private presenceCache;
    /** Cleared on every disconnect so a reconnect re-proves the join landed. */
    private joinAcknowledged;
    private socketObserver;
    private onFuncs;
    private realtimeObserver;
    constructor(channel: string, options: Partial<XanoRealtimeChannelOptions>, config: XanoClientConfig);
    /** The tier confirmed this channel is joined; stops the join retry. */
    private markJoinAcknowledged;
    private handleConnectionUpdate;
    /**
     * Send the join, retrying briefly if the v2 tier is not ready for it yet.
     *
     * A v2 handshake builds an ApplicationContext AFTER the socket opens, and any
     * frame arriving before that is refused with "Connection is not ready" — the
     * `auth_pending` guard. The refusal is a normal error frame, not a close, so
     * an un-retried join is simply LOST and the channel stays silently unjoined:
     * the socket looks healthy while no messages ever arrive. That is most likely
     * precisely on the reconnect path, where the app is not there to re-issue it.
     *
     * v1 has no such guard, so this only retries for v2.
     */
    private sendJoin;
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
    history(): void;
}
//# sourceMappingURL=realtime-channel.d.ts.map