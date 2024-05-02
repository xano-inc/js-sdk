import { IRealtimeClient } from "../interfaces/realtime-client";
import { XanoRealtimeChannel } from "./realtime-channel";
export declare class RealtimeClient implements IRealtimeClient {
    private readonly channel;
    extras: Record<string, any>;
    permissions: {
        dbo_id: number;
        row_id: number;
    };
    socketId: string;
    constructor(client: IRealtimeClient, channel: XanoRealtimeChannel);
    message(payload: any): void;
}
//# sourceMappingURL=realtime-client.d.ts.map