"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoRealtimeChannel = void 0;
var realtime_action_1 = require("../enums/realtime-action");
var realtime_connection_status_1 = require("../enums/realtime-connection-status");
var realtime_presence_action_enum_1 = require("../enums/realtime-presence-action.enum");
var observer_1 = require("./observer");
var realtime_client_1 = require("./realtime-client");
var realtime_state_1 = require("./realtime-state");
var realtime_build_action_util_1 = require("../utils/realtime-build-action.util");
var XanoRealtimeChannel = /** @class */ (function () {
    function XanoRealtimeChannel(channel, options, config) {
        this.channel = channel;
        this.options = options;
        this.config = config;
        this.observed = false;
        this.offlineMessageQueue = [];
        this.presenceCache = [];
        /** Cleared on every disconnect so a reconnect re-proves the join landed. */
        this.joinAcknowledged = false;
        this.socketObserver = realtime_state_1.XanoRealtimeState.getInstance().setConfig(this.config).getSocketObserver();
        this.onFuncs = [];
        this.realtimeObserver = new (/** @class */ (function (_super) {
            __extends(XanoRealtimeObserver, _super);
            function XanoRealtimeObserver(realtimeChannel) {
                var _this = _super.call(this) || this;
                _this.realtimeChannel = realtimeChannel;
                return _this;
            }
            XanoRealtimeObserver.prototype.update = function (rawAction) {
                var _a, _b;
                // v1 addresses a frame with `options.channel`; v2 puts `channel` at the
                // top level. Reading both is what lets one observer serve either tier —
                // checking only options.channel would pass every v2 frame to every
                // channel, since the field is simply absent there.
                var channel = (_b = (_a = rawAction === null || rawAction === void 0 ? void 0 : rawAction.options) === null || _a === void 0 ? void 0 : _a.channel) !== null && _b !== void 0 ? _b : rawAction === null || rawAction === void 0 ? void 0 : rawAction.channel;
                if (channel && channel !== this.realtimeChannel.channel) {
                    return;
                }
                // A `replay` is the same message the app already knows how to handle,
                // redelivered because it was missed while offline. Surfacing it as its
                // own action would force every app to register a second handler with
                // logic identical to its `message` one -- and the failure mode of
                // forgetting is silent and rare: messages vanish only for users who
                // happen to reconnect across a gap. So it is normalised to `message`
                // carrying `replayed: true`, which follows the tier's OWN precedent for
                // conversation-transcript replay (delivered as `message` with
                // `conversation: true`, not as a distinct action). An app that wants to
                // treat a replay differently branches on the marker.
                var action = rawAction.action === realtime_action_1.ERealtimeAction.Replay
                    ? __assign(__assign({}, rawAction), { action: realtime_action_1.ERealtimeAction.Message, replayed: true }) : rawAction;
                switch (action.action) {
                    case realtime_action_1.ERealtimeAction.ConnectionStatus:
                        this.realtimeChannel.handleConnectionUpdate(action);
                        this.realtimeChannel.processOfflineMessageQueue();
                        break;
                    case realtime_action_1.ERealtimeAction.Join:
                        // The tier's own confirmation that this channel is joined; it is
                        // what stops the join retry above.
                        this.realtimeChannel.markJoinAcknowledged();
                        break;
                    case realtime_action_1.ERealtimeAction.PresenceFull:
                    case realtime_action_1.ERealtimeAction.PresenceUpdate:
                    case realtime_action_1.ERealtimeAction.PresenceJoin:
                    case realtime_action_1.ERealtimeAction.PresenceLeave:
                        this.realtimeChannel.handlePresenceUpdate(action);
                        break;
                }
                for (var _i = 0, _c = this.realtimeChannel.onFuncs; _i < _c.length; _i++) {
                    var onFunc = _c[_i];
                    if (onFunc.action && onFunc.action !== action.action) {
                        continue;
                    }
                    if (action.action === realtime_action_1.ERealtimeAction.Error) {
                        if (onFunc.onError) {
                            onFunc.onError(action);
                        }
                    }
                    else {
                        onFunc.onFunc(action);
                    }
                }
                // Advance the durable cursor once the handlers have seen the message.
                // Doing it here rather than making the app call ack() removes the other
                // silent-failure step: forgetting to ack does not break anything
                // visibly, it just makes every reconnect replay the whole retained
                // window. Deliberately AFTER the handler loop, so a handler that throws
                // leaves the cursor unadvanced and the message is redelivered.
                this.realtimeChannel.autoAck(action);
            };
            return XanoRealtimeObserver;
        }(observer_1.Observer)))(this);
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        var action = {
            action: realtime_action_1.ERealtimeAction.ConnectionStatus,
            options: {},
            payload: {
                status: realtime_connection_status_1.ERealtimeConnectionStatus.Connected,
            },
        };
        for (var _i = 0, _a = this.onFuncs; _i < _a.length; _i++) {
            var onFunc = _a[_i];
            if (onFunc.action && onFunc.action !== action.action) {
                continue;
            }
            onFunc.onFunc(action);
        }
        this.handleConnectionUpdate(action);
    }
    /** The tier confirmed this channel is joined; stops the join retry. */
    XanoRealtimeChannel.prototype.markJoinAcknowledged = function () {
        this.joinAcknowledged = true;
    };
    XanoRealtimeChannel.prototype.handleConnectionUpdate = function (action) {
        if (action.payload.status !== realtime_connection_status_1.ERealtimeConnectionStatus.Connected) {
            // A dropped socket joins nothing, so the next Connected must re-prove the
            // join rather than trusting the previous connection's acknowledgement.
            this.joinAcknowledged = false;
            return;
        }
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        var state = realtime_state_1.XanoRealtimeState.getInstance();
        // This runs on EVERY transition to Connected, including the one after an
        // automatic reconnect — which is what re-joins the channel without the app
        // doing anything. On v2 the join carries the stable client_id, so the
        // server can recognise the returning client and replay the gap it missed
        // (it answers `resumed: true` plus `replay` frames). Omit the id and a
        // reconnect silently becomes a fresh join with no backlog.
        var options = { channel: this.channel };
        if (state.isV2()) {
            options.client_id = state.getClientId();
        }
        var message = (0, realtime_build_action_util_1.realtimeBuildActionUtil)(realtime_action_1.ERealtimeAction.Join, options, {
            history: this.options.history || false,
            presence: this.options.presence || false,
        });
        this.sendJoin(socket, message);
    };
    /**
     * Send the join, retrying briefly if the v2 tier is not ready for it yet.
     *
     * A v2 handshake builds an ApplicationContext AFTER the socket opens, and any
     * frame arriving before that is refused with "Connection is not ready" — the
     * `auth_pending` guard. The refusal is a normal error frame, not a close, so
     * an un-retried join is simply LOST and the channel stays silently unjoined:
     * the socket looks healthy while no messages ever arrive. That is most likely
     * precisely on the reconnect path, where the app is not there to re-issue it.
     *
     * v1 has no such guard, so this only retries for v2.
     */
    XanoRealtimeChannel.prototype.sendJoin = function (socket, message, attempt) {
        var _this = this;
        if (attempt === void 0) { attempt = 0; }
        var state = realtime_state_1.XanoRealtimeState.getInstance();
        if (!state.isV2() || attempt >= XanoRealtimeChannel.JOIN_MAX_ATTEMPTS) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(message);
            }
            return;
        }
        // Re-read the live socket each attempt: a reconnect in flight replaces it,
        // and sending on the previous one would go nowhere.
        var current = state.getSocket();
        if (current === null) {
            return;
        }
        if (current.readyState !== WebSocket.OPEN) {
            setTimeout(function () { return _this.sendJoin(socket, message, attempt + 1); }, XanoRealtimeChannel.JOIN_RETRY_MS);
            return;
        }
        current.send(message);
        // The tier answers a refused join with an error frame rather than closing,
        // so confirm the join landed and re-send if it did not.
        setTimeout(function () {
            if (!_this.joinAcknowledged && attempt + 1 < XanoRealtimeChannel.JOIN_MAX_ATTEMPTS) {
                _this.sendJoin(socket, message, attempt + 1);
            }
        }, XanoRealtimeChannel.JOIN_RETRY_MS);
    };
    XanoRealtimeChannel.prototype.handlePresenceUpdate = function (action) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        // The roster arrives as `payload.presence` on v1 and `payload.members` on
        // v2, and v2 splits the delta into its own presence_join / presence_leave
        // actions rather than an `action` discriminator inside the payload.
        if (action.action === realtime_action_1.ERealtimeAction.PresenceFull) {
            var roster = (_d = (_b = (_a = action.payload) === null || _a === void 0 ? void 0 : _a.members) !== null && _b !== void 0 ? _b : (_c = action.payload) === null || _c === void 0 ? void 0 : _c.presence) !== null && _d !== void 0 ? _d : [];
            this.presenceCache = roster.map(function (client) { return new realtime_client_1.XanoRealtimeClient(client, _this); });
            return;
        }
        if (action.action === realtime_action_1.ERealtimeAction.PresenceJoin) {
            this.presenceCache.push(new realtime_client_1.XanoRealtimeClient(action.payload.member, this));
            return;
        }
        if (action.action === realtime_action_1.ERealtimeAction.PresenceLeave) {
            var gone_1 = (_e = action.payload) === null || _e === void 0 ? void 0 : _e.member;
            this.presenceCache = this.presenceCache.filter(function (item) { return !_this.isSameMember(item, gone_1); });
            return;
        }
        if (action.action === realtime_action_1.ERealtimeAction.PresenceUpdate) {
            if (action.payload.action === realtime_presence_action_enum_1.ERealtimePresenceAction.Join) {
                this.presenceCache.push(new realtime_client_1.XanoRealtimeClient(action.payload.presence, this));
            }
            else if (action.payload.action === realtime_presence_action_enum_1.ERealtimePresenceAction.Leave) {
                this.presenceCache = this.presenceCache.filter(function (item) { return item.socketId !== action.payload.presence.socketId; });
            }
        }
    };
    /**
     * v2 members are refcounted per IDENTITY, not per socket, so a member has no
     * socketId to match on — two tabs of one user collapse to a single entry.
     * Fall back to socketId so this stays correct for a v1 roster too.
     */
    XanoRealtimeChannel.prototype.isSameMember = function (item, gone) {
        if (!gone) {
            return false;
        }
        if (gone.id !== undefined && (item === null || item === void 0 ? void 0 : item.id) !== undefined) {
            return String(item.id) === String(gone.id);
        }
        return (item === null || item === void 0 ? void 0 : item.socketId) === (gone === null || gone === void 0 ? void 0 : gone.socketId);
    };
    XanoRealtimeChannel.prototype.on = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this.observed) {
            this.socketObserver.addObserver(this.realtimeObserver, true);
            this.observed = true;
        }
        if (typeof args[0] === "string") {
            this.onFuncs.push({
                action: args[0],
                onError: args[2],
                onFunc: args[1],
            });
        }
        else {
            this.onFuncs.push({ onFunc: args[0], onError: args[1] });
        }
        return this;
    };
    XanoRealtimeChannel.prototype.destroy = function () {
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket !== null) {
            var message = (0, realtime_build_action_util_1.realtimeBuildActionUtil)(realtime_action_1.ERealtimeAction.Leave, {
                channel: this.channel,
            });
            socket.send(message);
        }
        this.socketObserver.removeObserver(this.realtimeObserver);
    };
    XanoRealtimeChannel.prototype.message = function (payload, actionOptions) {
        if (actionOptions === void 0) { actionOptions = {}; }
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        // v1 publishes with `message`; v2 publishes with `broadcast` and routes on
        // a top-level `type` naming the channel's message object. Delivery arrives
        // as `message` on both tiers, so this asymmetry is confined to the send.
        var state = realtime_state_1.XanoRealtimeState.getInstance();
        var message = state.isV2()
            ? (0, realtime_build_action_util_1.realtimeBuildActionUtil)(realtime_action_1.ERealtimeAction.Broadcast, __assign(__assign({}, actionOptions), { channel: this.channel }), payload, this.options.messageType)
            : (0, realtime_build_action_util_1.realtimeBuildActionUtil)(realtime_action_1.ERealtimeAction.Message, __assign(__assign({}, actionOptions), { channel: this.channel }), payload);
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
        else if (this.options.queueOfflineActions) {
            this.offlineMessageQueue.push(message);
        }
    };
    /**
     * Acknowledge a delivered message automatically, unless the app opted out.
     *
     * A handler that throws propagates out of the observer before this runs, so
     * the cursor is not advanced and the tier redelivers on the next resumed
     * join -- which is the behaviour an at_least_once channel is chosen for.
     */
    XanoRealtimeChannel.prototype.autoAck = function (action) {
        if (this.options.manualAck) {
            return;
        }
        if (action.action !== realtime_action_1.ERealtimeAction.Message || !action.id) {
            return;
        }
        this.ack(action.id);
    };
    /**
     * Advance this client's durable cursor on an `at_least_once` channel (v2).
     *
     * Called automatically for every delivered message, so an app only needs
     * this when it sets `manualAck` to defer acknowledgement past the handler --
     * e.g. until the message is persisted or a user has actually seen it.
     *
     * Only meaningful with a stable client_id: the cursor is stored against it,
     * and it is what bounds the replay after a resumed join.
     */
    XanoRealtimeChannel.prototype.ack = function (cursor) {
        var state = realtime_state_1.XanoRealtimeState.getInstance();
        if (!state.isV2()) {
            return;
        }
        var socket = state.getSocket();
        if (socket === null || socket.readyState !== WebSocket.OPEN) {
            return;
        }
        socket.send((0, realtime_build_action_util_1.realtimeBuildActionUtil)(realtime_action_1.ERealtimeAction.Ack, { channel: this.channel, client_id: state.getClientId() }, { cursor: cursor }));
    };
    XanoRealtimeChannel.prototype.processOfflineMessageQueue = function () {
        if (!this.options.queueOfflineActions) {
            return;
        }
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        while (this.offlineMessageQueue.length) {
            var message = this.offlineMessageQueue.shift();
            if (message) {
                socket.send(message);
            }
        }
    };
    XanoRealtimeChannel.prototype.getPresence = function () {
        return this.presenceCache;
    };
    XanoRealtimeChannel.prototype.history = function () {
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        var message = (0, realtime_build_action_util_1.realtimeBuildActionUtil)(realtime_action_1.ERealtimeAction.History, {
            channel: this.channel,
        });
        socket.send(message);
    };
    /** Retry budget for a join refused by the v2 auth_pending guard. */
    XanoRealtimeChannel.JOIN_MAX_ATTEMPTS = 5;
    XanoRealtimeChannel.JOIN_RETRY_MS = 400;
    return XanoRealtimeChannel;
}());
exports.XanoRealtimeChannel = XanoRealtimeChannel;
//# sourceMappingURL=realtime-channel.js.map