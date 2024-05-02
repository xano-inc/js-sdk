"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeBuildCommandUtil = void 0;
var realtimeBuildCommandUtil = function (command, commandOptions, payload) {
    if (payload === void 0) { payload = null; }
    return JSON.stringify({
        command: command,
        commandOptions: commandOptions,
        payload: payload,
    });
};
exports.realtimeBuildCommandUtil = realtimeBuildCommandUtil;
//# sourceMappingURL=realtime-build-message.util.js.map