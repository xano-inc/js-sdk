import { IRealtimeChannelOptions } from "../interfaces/realtime-channel-options";
import { IRealtimeCommandOptions } from "../interfaces/realtime-command-options";
import { RealtimeClient } from "./realtime-client";
import { XanoClientConfig } from "../interfaces/client-config";
export declare class XanoRealtimeChannel {
    readonly channel: string;
    readonly options: Partial<IRealtimeChannelOptions>;
    private readonly config;
    private observed;
    private presenceCache;
    private socketObserver;
    private onFuncs;
    private realtimeObserver;
    constructor(channel: string, options: Partial<IRealtimeChannelOptions>, config: XanoClientConfig);
    private handleConnectionUpdate;
    private handlePresenceUpdate;
    on(onFunc: CallableFunction, onError?: CallableFunction): XanoRealtimeChannel;
    destroy(): void;
    message(payload: any, commandOptions?: Partial<IRealtimeCommandOptions>): void;
    getPresence(): RealtimeClient[];
}
//# sourceMappingURL=realtime-channel.d.ts.map