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
    XanoResponse.prototype.prefixArray = function (arr, objectPrefix) {
        var _this = this;
        var prefixedArray = [];
        arr.forEach(function (item) {
            var prefixedItem = _this.prefixObject(item, objectPrefix);
            prefixedArray.push(prefixedItem);
        });
        return prefixedArray;
    };
    XanoResponse.prototype.prefixObject = function (obj, objectPrefix) {
        var prefixedObject = {};
        Object.keys(obj).forEach(function (key) {
            var prefixedKey = "".concat(objectPrefix).concat(key);
            prefixedObject[prefixedKey] = obj[key];
        });
        return prefixedObject;
    };
    XanoResponse.prototype.getBody = function (objectPrefix) {
        if (objectPrefix === void 0) { objectPrefix = ''; }
        objectPrefix = objectPrefix || this.objectPrefix;
        if (objectPrefix && typeof this.body === 'object') {
            if (Array.isArray(this.body)) {
                return this.prefixArray(this.body, objectPrefix);
            }
            else {
                return this.prefixObject(this.body, objectPrefix);
            }
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