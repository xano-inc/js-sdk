export enum ERealtimeAction {
  ConnectionStatus = "connection_status",
  Error = "error",
  Event = "event",
  History = "history",
  Join = "join",
  Leave = "leave",
  Message = "message",
  PresenceFull = "presence_full",
  PresenceUpdate = "presence_update",

  // --- realtime v2 only -----------------------------------------------
  // The v2 tier publishes with `broadcast` and delivers with `message`, so a
  // v2 client SENDS Broadcast where a v1 client sends Message. Both keep
  // arriving as Message, which is why the two are separate members rather
  // than a rename: an existing `on(ERealtimeAction.Message, ...)` handler
  // keeps working unchanged against v2.
  Broadcast = "broadcast",
  /** Client -> server cursor advance on an `at_least_once` channel. */
  Ack = "ack",
  /** A message missed while disconnected, redelivered after a resumed join. */
  Replay = "replay",
  /** Explicit presence roster request (v2 answers with PresenceFull). */
  Presence = "presence",
  PresenceJoin = "presence_join",
  PresenceLeave = "presence_leave",
  /** Transcript replay brackets emitted around a joined client's backlog. */
  ConversationStart = "conversation_start",
  ConversationEnd = "conversation_end",
}
