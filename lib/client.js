"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.XanoClient = void 0;
var base_client_1 = require("./base-client");
var XanoClient = /** @class */ (function (_super) {
    __extends(XanoClient, _super);
    function XanoClient() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    XanoClient.prototype.getFormDataInstance = function () {
        return new FormData;
    };
    return XanoClient;
}(base_client_1.XanoBaseClient));
exports.XanoClient = XanoClient;
//# sourceMappingURL=client.js.map