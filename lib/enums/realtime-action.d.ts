export declare enum ERealtimeAction {
    ConnectionStatus = "connection_status",
    Error = "error",
    Event = "event",
    History = "history",
    Join = "join",
    Leave = "leave",
    Message = "message",
    PresenceFull = "presence_full",
    PresenceUpdate = "presence_update",
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
    ConversationEnd = "conversation_end"
}
//# sourceMappingURL=realtime-action.d.ts.map