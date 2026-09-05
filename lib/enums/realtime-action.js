"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERealtimeAction = void 0;
var ERealtimeAction;
(function (ERealtimeAction) {
    ERealtimeAction["ConnectionStatus"] = "connection_status";
    ERealtimeAction["Error"] = "error";
    ERealtimeAction["Event"] = "event";
    ERealtimeAction["History"] = "history";
    ERealtimeAction["Join"] = "join";
    ERealtimeAction["Leave"] = "leave";
    ERealtimeAction["Message"] = "message";
    ERealtimeAction["PresenceFull"] = "presence_full";
    ERealtimeAction["PresenceUpdate"] = "presence_update";
    // --- realtime v2 only -----------------------------------------------
    // The v2 tier publishes with `broadcast` and delivers with `message`, so a
    // v2 client SENDS Broadcast where a v1 client sends Message. Both keep
    // arriving as Message, which is why the two are separate members rather
    // than a rename: an existing `on(ERealtimeAction.Message, ...)` handler
    // keeps working unchanged against v2.
    ERealtimeAction["Broadcast"] = "broadcast";
    /** Client -> server cursor advance on an `at_least_once` channel. */
    ERealtimeAction["Ack"] = "ack";
    /** A message missed while disconnected, redelivered after a resumed join. */
    ERealtimeAction["Replay"] = "replay";
    /** Explicit presence roster request (v2 answers with PresenceFull). */
    ERealtimeAction["Presence"] = "presence";
    ERealtimeAction["PresenceJoin"] = "presence_join";
    ERealtimeAction["PresenceLeave"] = "presence_leave";
    /** Transcript replay brackets emitted around a joined client's backlog. */
    ERealtimeAction["ConversationStart"] = "conversation_start";
    ERealtimeAction["ConversationEnd"] = "conversation_end";
})(ERealtimeAction || (exports.ERealtimeAction = ERealtimeAction = {}));
//# sourceMappingURL=realtime-action.js.map