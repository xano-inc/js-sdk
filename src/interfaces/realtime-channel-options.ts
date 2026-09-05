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
  /**
   * v2 only: take over cursor acknowledgement on an `at_least_once` channel.
   *
   * By default the SDK acks each message after your handlers have run, so a
   * throwing handler leaves it to be redelivered. Set this when "handled" means
   * something the SDK cannot observe — persisted to a database, or seen by a
   * user — and call `channel.ack(id)` yourself at that point.
   */
  manualAck?: boolean;
}
