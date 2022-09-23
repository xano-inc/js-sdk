"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoResponse = void 0;
var XanoResponse = /** @class */ (function () {
    function XanoResponse(response) {
        this.response = response;
    }
    XanoResponse.prototype.getBody = function () {
        return this.response.data;
    };
    XanoResponse.prototype.getHeaders = function () {
        return this.response.headers;
    };
    XanoResponse.prototype.getStatusCode = function () {
        return this.response.status;
    };
    return XanoResponse;
}());
exports.XanoResponse = XanoResponse;
//# sourceMappingURL=response.js.map