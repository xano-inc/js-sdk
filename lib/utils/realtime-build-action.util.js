"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeBuildActionUtil = void 0;
var realtimeBuildActionUtil = function (action, options, payload, type) {
    if (payload === void 0) { payload = null; }
    var frame = {
        action: action,
        options: options,
        payload: payload,
    };
    // v2 routes a broadcast to a named message object via a TOP-LEVEL `type`
    // (not one nested in options). Omitted entirely when absent so a v1 frame is
    // byte-identical to what this builder produced before.
    if (type) {
        frame.type = type;
    }
    return JSON.stringify(frame);
};
exports.realtimeBuildActionUtil = realtimeBuildActionUtil;
//# sourceMappingURL=realtime-build-action.util.js.map