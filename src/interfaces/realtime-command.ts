import { ERealtimeCommand } from "../enums/realtime-command";
import { XanoRealtimeClient } from "./realtime-client";
import { XanoRealtimeCommandOptions } from "./realtime-command-options";

export interface XanoRealtimeCommand {
  client?: XanoRealtimeClient;
  command: ERealtimeCommand;
  commandOptions?: XanoRealtimeCommandOptions;
  payload: Record<string, any>;
}
