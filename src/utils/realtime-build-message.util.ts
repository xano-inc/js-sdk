import { ERealtimeCommand } from "../enums/realtime-command";
import { XanoRealtimeCommand } from "../interfaces/realtime-command";
import { XanoRealtimeCommandOptions } from "../interfaces/realtime-command-options";

export const realtimeBuildCommandUtil = (
  command: ERealtimeCommand,
  commandOptions: XanoRealtimeCommandOptions,
  payload: any = null
): string => {
  return JSON.stringify(<XanoRealtimeCommand>{
    command,
    commandOptions,
    payload,
  });
};
