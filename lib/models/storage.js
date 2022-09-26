"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoStorage = void 0;
var XanoStorage = /** @class */ (function () {
    function XanoStorage() {
        this.storage = {};
    }
    XanoStorage.prototype.clear = function () {
        this.storage = {};
    };
    XanoStorage.prototype.getAll = function () {
        return this.storage;
    };
    XanoStorage.prototype.getItem = function (key) {
        var _a;
        return (_a = this.storage[key]) !== null && _a !== void 0 ? _a : null;
    };
    XanoStorage.prototype.removeItem = function (key) {
        delete this.storage[key];
    };
    XanoStorage.prototype.setItem = function (key, value) {
        this.storage[key] = value;
    };
    return XanoStorage;
}());
exports.XanoStorage = XanoStorage;
//# sourceMappingURL=storage.js.map