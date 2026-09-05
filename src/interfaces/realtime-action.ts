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
  /** v2: stream id carried on delivered messages. */
  id?: string;
  /**
   * v2: true when this message is being redelivered because it was missed
   * while disconnected. It arrives through the normal `message` handler; branch
   * on this only if a replay should be treated differently from a live message.
   */
  replayed?: boolean;
  /** v2: frames are addressed to a channel at the top level, not in options. */
  channel?: string;
}
