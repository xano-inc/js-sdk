import { ERealtimeAction } from "../enums/realtime-action";
import { XanoRealtimeActionOptions } from "./realtime-action-options";
import { XanoRealtimeClient } from "./realtime-client";

export interface XanoRealtimeAction {
  action: ERealtimeAction;
  client?: XanoRealtimeClient;
  options?: XanoRealtimeActionOptions;
  payload: any;
  /** v2: names the channel message object a broadcast routes to. */
  type?: string;
  /** v2: stream id carried on delivered `message` / `replay` frames. */
  id?: string;
  /** v2: frames are addressed to a channel at the top level, not in options. */
  channel?: string;
}
