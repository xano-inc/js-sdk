import { ERealtimeCommand } from "../enums/realtime-command";
import { IRealtimeCommand } from "../interfaces/realtime-command";
import { IRealtimeCommandOptions } from "../interfaces/realtime-command-options";

export const realtimeBuildCommandUtil = (
  command: ERealtimeCommand,
  commandOptions: IRealtimeCommandOptions,
  payload: any = null
): string => {
  return JSON.stringify(<IRealtimeCommand>{
    command,
    commandOptions,
    payload,
  });
};
