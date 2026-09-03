import { ERealtimeAction } from "../enums/realtime-action";
import { XanoRealtimeAction } from "../interfaces/realtime-action";
import { XanoRealtimeActionOptions } from "../interfaces/realtime-action-options";

export const realtimeBuildActionUtil = (
  action: ERealtimeAction,
  options: XanoRealtimeActionOptions,
  payload: any = null,
  type?: string
): string => {
  const frame: XanoRealtimeAction = {
    action,
    options,
    payload,
  };

  // v2 routes a broadcast to a named message object via a TOP-LEVEL `type`
  // (not one nested in options). Omitted entirely when absent so a v1 frame is
  // byte-identical to what this builder produced before.
  if (type) {
    frame.type = type;
  }

  return JSON.stringify(frame);
};
