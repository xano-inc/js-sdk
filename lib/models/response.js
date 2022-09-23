"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoResponse = void 0;
var XanoResponse = /** @class */ (function () {
    function XanoResponse(response) {
        var _a, _b;
        this.body = response.data;
        this.headers = (_a = response.headers) !== null && _a !== void 0 ? _a : {};
        this.response = response;
        if (typeof this.body === 'string' && this.body.length > 0) {
            var contentType = (_b = this.headers['content-type']) !== null && _b !== void 0 ? _b : '';
            if (contentType.indexOf('application/json') === 0) {
                try {
                    this.body = JSON.parse(this.body);
                }
                catch (e) { }
            }
        }
    }
    XanoResponse.prototype.getBody = function () {
        return this.body;
    };
    XanoResponse.prototype.getHeaders = function () {
        return this.headers;
    };
    XanoResponse.prototype.getStatusCode = function () {
        return this.response.status;
    };
    return XanoResponse;
}());
exports.XanoResponse = XanoResponse;
//# sourceMappingURL=response.js.map