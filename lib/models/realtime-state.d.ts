import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeAction } from "../interfaces/realtime-action";
export declare class XanoRealtimeState {
    private static _instance;
    /**
     * Wait before the next v2 readiness ping after a "not ready" answer. For the
     * first second after the socket opens it is 100ms, so the usual handshake
     * (a few hundred ms) is noticed within 100ms of ending. After that it doubles
     * up to 1s, so a tier that stays busy for seconds is asked once a second
     * rather than ten times.
     */
    private static readonly READY_PROBE_MIN_MS;
    private static readonly READY_PROBE_FAST_FOR_MS;
    private static readonly READY_PROBE_MAX_MS;
    /**
     * The v2 tier's refusal of a frame that arrived before it finished
     * authenticating the socket. It carries no channel.
     */
    private static readonly NOT_READY;
    private static readonly PING;
    private static readonly PONG;
    private config;
    private socket;
    /** The socket the tier has confirmed it accepts frames on; see isReady(). */
    private readySocket;
    private generatedClientId;
    private reconnectSettings;
    private socketObserver;
    constructor();
    static getInstance(): XanoRealtimeState;
    /** True when this client is configured for the v2 (OpenSwoole) tier. */
    isV2(): boolean;
    /**
     * The stable client id a resumed join is keyed on (v2 only).
     *
     * It must be identical across a reconnect or the server treats the returning
     * client as a new one and replays nothing, so it is generated ONCE per
     * process and cached — never derived from the socket, whose fd is recycled.
     * An explicit `realtimeClientId` wins, which is how an app can persist one
     * across page loads (localStorage) and resume a gap spanning a reload.
     */
    getClientId(): string;
    /**
     * True when a frame sent on the current socket will be processed.
     *
     * v1 processes frames as soon as the socket opens. v2 does not: after the
     * socket opens, the tier authenticates it (building an app and running the
     * server's `connect` trigger), and it refuses every frame that arrives before
     * that finishes with a "Connection is not ready" error. The refused frame is
     * dropped, not queued. That window has no fixed length (about 150ms on an
     * idle tier, several seconds on a busy one), so on v2 the socket counts as
     * ready only once a readiness ping has been answered with `pong` (see
     * connect()). The tier answers `ping` only after the socket is
     * authenticated, and a socket never goes back to unauthenticated, so
     * anything sent after that is processed.
     *
     * Every frame a v2 channel sends goes through this check, so while a v2
     * socket is not ready, the readiness pings are the only frames on it.
     */
    isReady(): boolean;
    /** An error about the connection rather than a channel: it names none. */
    private static isConnectionError;
    private static isNotReadyRefusal;
    private triggerReconnect;
    private connect;
    private disconnect;
    reconnect(): void;
    getSocket(): WebSocket | null;
    setConfig(config: XanoClientConfig): this;
    getSocketObserver(): Observable<XanoRealtimeAction>;
}
//# sourceMappingURL=realtime-state.d.ts.map