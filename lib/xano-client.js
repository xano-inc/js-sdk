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
exports.XanoClient = void 0;
var content_type_1 = require("./enums/content-type");
var request_1 = require("./errors/request");
var request_type_1 = require("./enums/request-type");
var response_1 = require("./models/response");
var response_type_1 = require("./enums/response-type");
var XanoClient = /** @class */ (function () {
    function XanoClient(config) {
        this.config = {
            apiGroupBaseUrl: null,
            authToken: null,
            responseType: response_type_1.XanoResponseType.Default
        };
        this.config = __assign(__assign({}, this.config), config);
    }
    XanoClient.prototype.buildFormData = function (bodyData) {
        var formData = new FormData();
        var hasFile = false;
        var rawFormData = {};
        Object.entries(bodyData).forEach(function (entry) {
            var isFile = (entry[1] instanceof File);
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
    XanoClient.prototype.hasAuthToken = function () {
        var _a;
        return typeof ((_a = this.config) === null || _a === void 0 ? void 0 : _a.authToken) === 'string' && this.config.authToken.length > 0;
    };
    XanoClient.prototype.request = function (params) {
        var requestHeaders = new Headers();
        var url = new URL("".concat(this.config.apiGroupBaseUrl).concat(params.endpoint));
        if (params.urlParams) {
            this.updateUrlWithParams(url, params.urlParams);
        }
        if (this.hasAuthToken()) {
            requestHeaders.set('Authorization', "Bearer ".concat(this.config.authToken));
        }
        if (params.method === request_type_1.XanoRequestType.HEAD) {
            requestHeaders.set('Accept', content_type_1.XanoContentType.Text);
        }
        else if (this.config.responseType === response_type_1.XanoResponseType.Text) {
            requestHeaders.set('Accept', content_type_1.XanoContentType.Text);
        }
        else if (this.config.responseType === response_type_1.XanoResponseType.JSON) {
            requestHeaders.set('Accept', content_type_1.XanoContentType.JSON);
        }
        var requestOptions = {
            headers: requestHeaders,
            method: params.method
        };
        if (params.bodyParams) {
            var ret = this.buildFormData(params.bodyParams);
            if (ret.hasFile) {
                requestHeaders.delete('Content-Type');
                requestOptions.body = ret.formData;
            }
            else {
                requestHeaders.set('Content-Type', content_type_1.XanoContentType.JSON);
                requestOptions.body = JSON.stringify(ret.rawFormData);
            }
        }
        var rawResponse;
        return fetch(url.toString(), requestOptions).then(function (response) {
            rawResponse = response;
            if (requestHeaders.get('Accept') === content_type_1.XanoContentType.JSON) {
                return response.json();
            }
            return response.text();
        }).then(function (data) {
            var response = new response_1.XanoResponse(rawResponse, data);
            if (!rawResponse.ok) {
                throw new request_1.XanoRequestError('There was an error with your request', response);
            }
            return response;
        });
    };
    XanoClient.prototype.updateUrlWithParams = function (url, params) {
        var urlParams = new URLSearchParams(url.search);
        Object.keys(params).forEach(function (index) {
            urlParams.set(index, params[index]);
        });
        url.search = urlParams.toString();
    };
    XanoClient.prototype.setAuthToken = function (authToken) {
        this.config.authToken = authToken;
        return this;
    };
    XanoClient.prototype.setResponseType = function (responseType) {
        this.config.responseType = responseType;
        return this;
    };
    XanoClient.prototype.delete = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.DELETE,
        });
    };
    XanoClient.prototype.get = function (endpoint, params) {
        return this.request({
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.GET,
            urlParams: params,
        });
    };
    XanoClient.prototype.head = function (endpoint, params) {
        return this.request({
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.HEAD,
            urlParams: params,
        });
    };
    XanoClient.prototype.patch = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.PATCH,
        });
    };
    XanoClient.prototype.post = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.POST,
        });
    };
    XanoClient.prototype.put = function (endpoint, params) {
        return this.request({
            bodyParams: params,
            endpoint: endpoint,
            method: request_type_1.XanoRequestType.PUT,
        });
    };
    return XanoClient;
}());
exports.XanoClient = XanoClient;
//# sourceMappingURL=xano-client.js.map