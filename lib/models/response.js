"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoResponse = void 0;
var XanoResponse = /** @class */ (function () {
    function XanoResponse(response, body) {
        this.body = body;
        this.response = response;
    }
    XanoResponse.prototype.getBody = function () {
        return this.body;
    };
    XanoResponse.prototype.getHeaders = function () {
        var headers = {};
        this.response.headers.forEach(function (value, key) {
            headers[key] = value;
        });
        return headers;
    };
    XanoResponse.prototype.getStatusCode = function () {
        return this.response.status;
    };
    return XanoResponse;
}());
exports.XanoResponse = XanoResponse;
//# sourceMappingURL=response.js.map