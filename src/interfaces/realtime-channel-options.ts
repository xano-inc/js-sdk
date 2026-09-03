export interface XanoRealtimeChannelOptions {
  history?: boolean;
  presence?: boolean;
  queueOfflineActions?: boolean;
  /**
   * v2 only: the channel message object a broadcast routes to (the `message`
   * name in XanoScript). A v2 channel may define several, so the default is
   * deliberately none rather than a guess — set it per channel, or pass a type
   * per call.
   */
  messageType?: string;
}
