import { ERealtimeCommand } from "../enums/realtime-command";
import { IRealtimeClient } from "./realtime-client";
import { IRealtimeCommandOptions } from "./realtime-command-options";
export interface IRealtimeCommand {
    client?: IRealtimeClient;
    command: ERealtimeCommand;
    commandOptions?: IRealtimeCommandOptions;
    payload: Record<string, any>;
}
//# sourceMappingURL=realtime-command.d.ts.map