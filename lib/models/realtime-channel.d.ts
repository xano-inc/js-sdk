import { XanoClientConfig } from "../interfaces/client-config";
import { XanoRealtimeActionOptions } from "../interfaces/realtime-action-options";
import { XanoRealtimeChannelOptions } from "../interfaces/realtime-channel-options";
import { XanoRealtimeClient } from "./realtime-client";
export declare class XanoRealtimeChannel {
    readonly channel: string;
    readonly options: Partial<XanoRealtimeChannelOptions>;
    private readonly config;
    private observed;
    private offlineMessageQueue;
    private presenceCache;
    private socketObserver;
    private onFuncs;
    private realtimeObserver;
    constructor(channel: string, options: Partial<XanoRealtimeChannelOptions>, config: XanoClientConfig);
    private handleConnectionUpdate;
    private handlePresenceUpdate;
    on(onFunc: CallableFunction, onError?: CallableFunction): XanoRealtimeChannel;
    destroy(): void;
    message(payload: any, actionOptions?: Partial<XanoRealtimeActionOptions>): void;
    private processOfflineMessageQueue;
    getPresence(): XanoRealtimeClient[];
}
//# sourceMappingURL=realtime-channel.d.ts.map