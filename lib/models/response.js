"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoResponse = void 0;
var XanoResponse = /** @class */ (function () {
    function XanoResponse(response, objectPrefix) {
        if (objectPrefix === void 0) { objectPrefix = ''; }
        var _a, _b;
        this.body = response.data;
        this.headers = (_a = response.headers) !== null && _a !== void 0 ? _a : {};
        this.objectPrefix = objectPrefix;
        this.status = response.status;
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
    XanoResponse.prototype.getBody = function (objectPrefix) {
        var _this = this;
        if (objectPrefix === void 0) { objectPrefix = ''; }
        objectPrefix = objectPrefix || this.objectPrefix;
        if (objectPrefix && typeof this.body === 'object' && !Array.isArray(this.body)) {
            var prefixedBody_1 = {};
            Object.keys(this.body).forEach(function (key) {
                var prefixedKey = "".concat(objectPrefix).concat(key);
                prefixedBody_1[prefixedKey] = _this.body[key];
            });
            return prefixedBody_1;
        }
        return this.body;
    };
    XanoResponse.prototype.getHeaders = function () {
        return this.headers;
    };
    XanoResponse.prototype.getStatusCode = function () {
        return this.status;
    };
    return XanoResponse;
}());
exports.XanoResponse = XanoResponse;
//# sourceMappingURL=response.js.map