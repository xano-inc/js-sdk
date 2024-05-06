import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeCommand } from "../interfaces/realtime-command";
export declare class XanoRealtimeState {
    private static _instance;
    private config;
    private socket;
    private reconnectSettings;
    private socketObserver;
    constructor();
    static getInstance(): XanoRealtimeState;
    private triggerReconnect;
    private connect;
    private disconnect;
    getSocket(): WebSocket | null;
    setConfig(config: XanoClientConfig): this;
    getSocketObserver(): Observable<XanoRealtimeCommand>;
}
//# sourceMappingURL=realtime-state.d.ts.map