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
var realtime_command_1 = require("../enums/realtime-command");
var realtime_connection_status_1 = require("../enums/realtime-connection-status");
var realtime_presence_action_enum_1 = require("../enums/realtime-presence-action.enum");
var observer_1 = require("./observer");
var realtime_client_1 = require("./realtime-client");
var realtime_state_1 = require("./realtime-state");
var realtime_build_message_util_1 = require("../utils/realtime-build-message.util");
var XanoRealtimeChannel = /** @class */ (function () {
    function XanoRealtimeChannel(channel, options, config) {
        this.channel = channel;
        this.options = options;
        this.config = config;
        this.observed = false;
        this.offlineMessageQueue = [];
        this.presenceCache = [];
        this.socketObserver = realtime_state_1.XanoRealtimeState.getInstance().setConfig(this.config).getSocketObserver();
        this.onFuncs = [];
        this.realtimeObserver = new (/** @class */ (function (_super) {
            __extends(XanoRealtimeObserver, _super);
            function XanoRealtimeObserver(realtimeChannel) {
                var _this = _super.call(this) || this;
                _this.realtimeChannel = realtimeChannel;
                return _this;
            }
            XanoRealtimeObserver.prototype.update = function (command) {
                var _a;
                var channel = (_a = command === null || command === void 0 ? void 0 : command.commandOptions) === null || _a === void 0 ? void 0 : _a.channel;
                if (channel && channel !== this.realtimeChannel.channel) {
                    return;
                }
                switch (command.command) {
                    case realtime_command_1.ERealtimeCommand.ConnectionStatus:
                        this.realtimeChannel.handleConnectionUpdate(command);
                        this.realtimeChannel.processOfflineMessageQueue();
                        break;
                    case realtime_command_1.ERealtimeCommand.PresenceFull:
                    case realtime_command_1.ERealtimeCommand.PresenceUpdate:
                        this.realtimeChannel.handlePresenceUpdate(command);
                        break;
                }
                for (var _i = 0, _b = this.realtimeChannel.onFuncs; _i < _b.length; _i++) {
                    var onFunc = _b[_i];
                    if (command.command === realtime_command_1.ERealtimeCommand.Error) {
                        if (onFunc.onError) {
                            onFunc.onError(command);
                        }
                    }
                    else {
                        onFunc.onFunc(command);
                    }
                }
            };
            return XanoRealtimeObserver;
        }(observer_1.Observer)))(this);
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        var command = {
            command: realtime_command_1.ERealtimeCommand.ConnectionStatus,
            commandOptions: {},
            payload: {
                status: realtime_connection_status_1.ERealtimeConnectionStatus.Connected,
            },
        };
        for (var _i = 0, _a = this.onFuncs; _i < _a.length; _i++) {
            var onFunc = _a[_i];
            onFunc.onFunc(command);
        }
        this.handleConnectionUpdate(command);
    }
    XanoRealtimeChannel.prototype.handleConnectionUpdate = function (command) {
        if (command.payload.status !== realtime_connection_status_1.ERealtimeConnectionStatus.Connected) {
            return;
        }
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        var message = (0, realtime_build_message_util_1.realtimeBuildCommandUtil)(realtime_command_1.ERealtimeCommand.Join, {
            channel: this.channel,
        }, {
            presence: this.options.presence || false,
        });
        socket.send(message);
    };
    XanoRealtimeChannel.prototype.handlePresenceUpdate = function (command) {
        var _this = this;
        if (command.command === realtime_command_1.ERealtimeCommand.PresenceFull) {
            this.presenceCache = command.payload.presence.map(function (client) { return new realtime_client_1.RealtimeClient(client, _this); });
        }
        else if (command.command === realtime_command_1.ERealtimeCommand.PresenceUpdate) {
            if (command.payload.action === realtime_presence_action_enum_1.ERealtimePresenceAction.Join) {
                this.presenceCache.push(new realtime_client_1.RealtimeClient(command.payload.presence, this));
            }
            else if (command.payload.action === realtime_presence_action_enum_1.ERealtimePresenceAction.Leave) {
                this.presenceCache = this.presenceCache.filter(function (item) { return item.socketId !== command.payload.presence.socketId; });
            }
        }
    };
    XanoRealtimeChannel.prototype.on = function (onFunc, onError) {
        if (!this.observed) {
            this.socketObserver.addObserver(this.realtimeObserver, true);
            this.observed = true;
        }
        this.onFuncs.push({ onFunc: onFunc, onError: onError });
        return this;
    };
    XanoRealtimeChannel.prototype.destroy = function () {
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket !== null) {
            var message = (0, realtime_build_message_util_1.realtimeBuildCommandUtil)(realtime_command_1.ERealtimeCommand.Leave, {
                channel: this.channel,
            });
            socket.send(message);
        }
        this.socketObserver.removeObserver(this.realtimeObserver);
    };
    XanoRealtimeChannel.prototype.message = function (payload, commandOptions) {
        if (commandOptions === void 0) { commandOptions = {}; }
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        var message = (0, realtime_build_message_util_1.realtimeBuildCommandUtil)(realtime_command_1.ERealtimeCommand.Message, __assign(__assign({}, commandOptions), { channel: this.channel }), payload);
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
        else if (this.options.queueOfflineMessages) {
            this.offlineMessageQueue.push(message);
        }
    };
    XanoRealtimeChannel.prototype.processOfflineMessageQueue = function () {
        if (!this.options.queueOfflineMessages) {
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
    return XanoRealtimeChannel;
}());
exports.XanoRealtimeChannel = XanoRealtimeChannel;
//# sourceMappingURL=realtime-channel.js.map