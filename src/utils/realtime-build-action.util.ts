import { ERealtimeAction } from "../enums/realtime-action";
import { XanoRealtimeAction } from "../interfaces/realtime-action";
import { XanoRealtimeActionOptions } from "../interfaces/realtime-action-options";

export const realtimeBuildActionUtil = (
  action: ERealtimeAction,
  options: XanoRealtimeActionOptions,
  payload: any = null
): string => {
  return JSON.stringify(<XanoRealtimeAction>{
    action,
    options,
    payload,
  });
};
