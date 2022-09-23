"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClient = void 0;
var content_type_1 = require("./enums/content-type");
var request_1 = require("./errors/request");
var request_type_1 = require("./enums/request-type");
var response_1 = require("./models/response");
var axios_1 = require("axios");
var BaseClient = /** @class */ (function () {
    function BaseClient(config) {
        this.config = {
            apiGroupBaseUrl: null,
            authToken: null
        };
        this.config = __assign(__assign({}, this.config), config);
    }
    BaseClient.prototype.buildFormData = function (bodyData) {
        var _this = this;
        var formData = this.getFormDataInstance();
        var hasFile = false;
        var rawFormData = {};
        Object.entries(bodyData).forEach(function (entry) {
            var isFile = _this.isFile(entry[1]);
            if (isFile) {
                hasFile = true;
            }
            if (typeof entry[1] === 'object' && !isFile) {
                entry[1] = JSON.stringify(entry[1]);
            }
            rawFormData[entry[0]] = entry[1];
            formData.append(entry[0], entry[1]);
        });
        return {
            formData: formData,
            hasFile: hasFile,
            rawFormData: rawFormData
        };
    };
    BaseClient.prototype.hasAuthToken = function () {
        var _a;
        return typeof ((_a = this.config) === null || _a === void 0 ? void 0 : _a.authToken) === 'string' && this.config.authToken.length > 0;
    };
    BaseClient.prototype.request = function (params) {
        var axiosConfig = {
            baseURL: this.config.apiGroupBaseUrl,
            headers: {},
            method: params.method,
            url: params.endpoint,
        };
        var requestHeaders = {};
        if (params.urlParams) {
            axiosConfig.params = params.urlParams;
        }
        if (this.hasAuthToken()) {
            requestHeaders['Authorization'] = "Bearer ".concat(this.config.authToken);
        }
        if (params.bodyParams) {
            var ret = this.buildFormData(params.bodyParams);
            if (ret.hasFile) {
                requestHeaders['Content-Type'] = content_type_1.XanoContentType.Multipart;
                axiosConfig.data = ret.formData;
            }
            else {
                requestHeaders['Content-Type'] = content_type_1.XanoContentType.JSON;
                axiosConfig.data = JSON.stringify(ret.rawFormData);
            }
        }
        axiosConfig.headers = requestHeaders;
        return (new axios_1.Axios({})).request(axiosConfig).then(function (response) {
            var resp = new response_1.XanoResponse(response);
            if (response.status < 200 || response.status > 299) {
                throw new request_1.XanoRequestError('There was an error with your request', resp);
            }
            return resp;
        });
    };
    BaseClient.prototype.setAuthToken = function (authToken) {
        this.config.authToken = authToken;
        return this;
    };
    BaseClient.prototype.delete = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.DELETE,
        });
    };
    BaseClient.prototype.get = function (endpoint, params) {
        return this.request({
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.GET,
            urlParams: params,
        });
    };
    BaseClient.prototype.head = function (endpoint, params) {
        return this.request({
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.HEAD,
            urlParams: params,
        });
    };
    BaseClient.prototype.patch = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.PATCH,
        });
    };
    BaseClient.prototype.post = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.POST,
        });
    };
    BaseClient.prototype.put = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.PUT,
        });
    };
    return BaseClient;
}());
exports.BaseClient = BaseClient;
//# sourceMappingURL=base-client.js.map