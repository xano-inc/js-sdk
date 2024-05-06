"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoRealtimeClient = void 0;
var realtime_command_1 = require("../enums/realtime-command");
var realtime_state_1 = require("./realtime-state");
var realtime_build_message_util_1 = require("../utils/realtime-build-message.util");
var XanoRealtimeClient = /** @class */ (function () {
    function XanoRealtimeClient(client, channel) {
        Object.assign(this, client);
        this.channel = channel;
    }
    XanoRealtimeClient.prototype.message = function (payload) {
        var socket = realtime_state_1.XanoRealtimeState.getInstance().getSocket();
        if (socket === null) {
            return;
        }
        var message = (0, realtime_build_message_util_1.realtimeBuildCommandUtil)(realtime_command_1.ERealtimeCommand.Message, {
            channel: this.channel.channel,
            socketId: this.socketId,
        }, payload);
        socket.send(message);
    };
    return XanoRealtimeClient;
}());
exports.XanoRealtimeClient = XanoRealtimeClient;
//# sourceMappingURL=realtime-client.js.map