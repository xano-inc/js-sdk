"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoResponse = void 0;
var XanoResponse = /** @class */ (function () {
    function XanoResponse(response) {
        var _a;
        this.response = response;
        this.body = response.data;
        if (typeof this.body === 'string' && this.body.length > 0) {
            var contentType = (_a = response.headers['content-type']) !== null && _a !== void 0 ? _a : '';
            if (contentType.indexOf('application/json') === 0) {
                try {
                    this.body = JSON.parse(this.response.data);
                }
                catch (e) { }
            }
        }
    }
    XanoResponse.prototype.getBody = function () {
        return this.body;
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