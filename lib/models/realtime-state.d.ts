import { IRealtimeCommand } from "../interfaces/realtime-command";
import { Observable } from "./observable";
import { XanoClientConfig } from "../interfaces/client-config";
export declare class XanoRealtimeState {
    private static _instance;
    private config;
    private socket;
    private reconnectSettings;
    private socketObserver;
    constructor();
    static getInstance(): XanoRealtimeState;
    private connect;
    private disconnect;
    getSocket(): WebSocket | null;
    setConfig(config: XanoClientConfig): this;
    getSocketObserver(): Observable<IRealtimeCommand>;
}
//# sourceMappingURL=realtime-state.d.ts.map