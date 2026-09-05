import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeAction } from "../interfaces/realtime-action";
export declare class XanoRealtimeState {
    private static _instance;
    private config;
    private socket;
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
    private triggerReconnect;
    private connect;
    private disconnect;
    reconnect(): void;
    getSocket(): WebSocket | null;
    setConfig(config: XanoClientConfig): this;
    getSocketObserver(): Observable<XanoRealtimeAction>;
}
//# sourceMappingURL=realtime-state.d.ts.map