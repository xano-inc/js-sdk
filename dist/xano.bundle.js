/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/enums/content-type.ts":
/*!***********************************!*\
  !*** ./src/enums/content-type.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"XanoContentType\": () => (/* binding */ XanoContentType)\n/* harmony export */ });\nvar XanoContentType;\n(function (XanoContentType) {\n    XanoContentType[\"JSON\"] = \"application/json\";\n    XanoContentType[\"Multipart\"] = \"multipart/form-data\";\n    XanoContentType[\"Text\"] = \"text/plain\";\n})(XanoContentType || (XanoContentType = {}));\n;\n\n\n//# sourceURL=webpack://js-sdk/./src/enums/content-type.ts?");

/***/ }),

/***/ "./src/enums/request-type.ts":
/*!***********************************!*\
  !*** ./src/enums/request-type.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"XanoRequestType\": () => (/* binding */ XanoRequestType)\n/* harmony export */ });\nvar XanoRequestType;\n(function (XanoRequestType) {\n    XanoRequestType[\"DELETE\"] = \"DELETE\";\n    XanoRequestType[\"GET\"] = \"GET\";\n    XanoRequestType[\"HEAD\"] = \"HEAD\";\n    XanoRequestType[\"PATCH\"] = \"PATCH\";\n    XanoRequestType[\"POST\"] = \"POST\";\n    XanoRequestType[\"PUT\"] = \"PUT\";\n})(XanoRequestType || (XanoRequestType = {}));\n\n\n//# sourceURL=webpack://js-sdk/./src/enums/request-type.ts?");

/***/ }),

/***/ "./src/enums/response-type.ts":
/*!************************************!*\
  !*** ./src/enums/response-type.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"XanoResponseType\": () => (/* binding */ XanoResponseType)\n/* harmony export */ });\nvar XanoResponseType;\n(function (XanoResponseType) {\n    XanoResponseType[\"JSON\"] = \"json\";\n    XanoResponseType[\"Text\"] = \"text\";\n    XanoResponseType[\"Default\"] = \"json\";\n})(XanoResponseType || (XanoResponseType = {}));\n\n\n//# sourceURL=webpack://js-sdk/./src/enums/response-type.ts?");

/***/ }),

/***/ "./src/errors/request.ts":
/*!*******************************!*\
  !*** ./src/errors/request.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"XanoRequestError\": () => (/* binding */ XanoRequestError)\n/* harmony export */ });\nvar __extends = (undefined && undefined.__extends) || (function () {\n    var extendStatics = function (d, b) {\n        extendStatics = Object.setPrototypeOf ||\n            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||\n            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };\n        return extendStatics(d, b);\n    };\n    return function (d, b) {\n        if (typeof b !== \"function\" && b !== null)\n            throw new TypeError(\"Class extends value \" + String(b) + \" is not a constructor or null\");\n        extendStatics(d, b);\n        function __() { this.constructor = d; }\n        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());\n    };\n})();\nvar XanoRequestError = /** @class */ (function (_super) {\n    __extends(XanoRequestError, _super);\n    function XanoRequestError(message, httpResponse) {\n        var _this = _super.call(this, message) || this;\n        _this.getHttpResponse = function () {\n            return httpResponse;\n        };\n        return _this;\n    }\n    return XanoRequestError;\n}(Error));\n\n\n\n//# sourceURL=webpack://js-sdk/./src/errors/request.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _xano_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./xano-client */ \"./src/xano-client.ts\");\n\n__webpack_require__.g.XanoClient = _xano_client__WEBPACK_IMPORTED_MODULE_0__.XanoClient;\n\n\n//# sourceURL=webpack://js-sdk/./src/index.ts?");

/***/ }),

/***/ "./src/models/response.ts":
/*!********************************!*\
  !*** ./src/models/response.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"XanoResponse\": () => (/* binding */ XanoResponse)\n/* harmony export */ });\nvar XanoResponse = /** @class */ (function () {\n    function XanoResponse(response, body) {\n        this.body = body;\n        this.response = response;\n    }\n    XanoResponse.prototype.getBody = function () {\n        return this.body;\n    };\n    XanoResponse.prototype.getHeaders = function () {\n        var headers = {};\n        this.response.headers.forEach(function (value, key) {\n            headers[key] = value;\n        });\n        return headers;\n    };\n    XanoResponse.prototype.getStatusCode = function () {\n        return this.response.status;\n    };\n    return XanoResponse;\n}());\n\n\n\n//# sourceURL=webpack://js-sdk/./src/models/response.ts?");

/***/ }),

/***/ "./src/xano-client.ts":
/*!****************************!*\
  !*** ./src/xano-client.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"XanoClient\": () => (/* binding */ XanoClient)\n/* harmony export */ });\n/* harmony import */ var _enums_content_type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./enums/content-type */ \"./src/enums/content-type.ts\");\n/* harmony import */ var _errors_request__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./errors/request */ \"./src/errors/request.ts\");\n/* harmony import */ var _enums_request_type__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./enums/request-type */ \"./src/enums/request-type.ts\");\n/* harmony import */ var _models_response__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./models/response */ \"./src/models/response.ts\");\n/* harmony import */ var _enums_response_type__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./enums/response-type */ \"./src/enums/response-type.ts\");\nvar __assign = (undefined && undefined.__assign) || function () {\n    __assign = Object.assign || function(t) {\n        for (var s, i = 1, n = arguments.length; i < n; i++) {\n            s = arguments[i];\n            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))\n                t[p] = s[p];\n        }\n        return t;\n    };\n    return __assign.apply(this, arguments);\n};\n\n\n\n\n\nvar XanoClient = /** @class */ (function () {\n    function XanoClient(config) {\n        this.config = {\n            apiGroupBaseUrl: null,\n            authToken: null,\n            responseType: _enums_response_type__WEBPACK_IMPORTED_MODULE_4__.XanoResponseType.Default\n        };\n        this.config = __assign(__assign({}, this.config), config);\n    }\n    XanoClient.prototype.buildFormData = function (bodyData) {\n        var formData = new FormData();\n        var hasFile = false;\n        var rawFormData = {};\n        Object.entries(bodyData).forEach(function (entry) {\n            var isFile = (entry[1] instanceof File);\n            if (isFile) {\n                hasFile = true;\n            }\n            if (typeof entry[1] === 'object' && !isFile) {\n                entry[1] = JSON.stringify(entry[1]);\n            }\n            rawFormData[entry[0]] = entry[1];\n            formData.append(entry[0], entry[1]);\n        });\n        return {\n            formData: formData,\n            hasFile: hasFile,\n            rawFormData: rawFormData\n        };\n    };\n    XanoClient.prototype.hasAuthToken = function () {\n        var _a;\n        return typeof ((_a = this.config) === null || _a === void 0 ? void 0 : _a.authToken) === 'string' && this.config.authToken.length > 0;\n    };\n    XanoClient.prototype.request = function (params) {\n        var requestHeaders = new Headers();\n        var url = new URL(\"\".concat(this.config.apiGroupBaseUrl).concat(params.endpoint));\n        if (params.urlParams) {\n            this.updateUrlWithParams(url, params.urlParams);\n        }\n        if (this.hasAuthToken()) {\n            requestHeaders.set('Authorization', \"Bearer \".concat(this.config.authToken));\n        }\n        if (params.method === _enums_request_type__WEBPACK_IMPORTED_MODULE_2__.XanoRequestType.HEAD) {\n            requestHeaders.set('Accept', _enums_content_type__WEBPACK_IMPORTED_MODULE_0__.XanoContentType.Text);\n        }\n        else if (this.config.responseType === _enums_response_type__WEBPACK_IMPORTED_MODULE_4__.XanoResponseType.Text) {\n            requestHeaders.set('Accept', _enums_content_type__WEBPACK_IMPORTED_MODULE_0__.XanoContentType.Text);\n        }\n        else if (this.config.responseType === _enums_response_type__WEBPACK_IMPORTED_MODULE_4__.XanoResponseType.JSON) {\n            requestHeaders.set('Accept', _enums_content_type__WEBPACK_IMPORTED_MODULE_0__.XanoContentType.JSON);\n        }\n        var requestOptions = {\n            headers: requestHeaders,\n            method: params.method\n        };\n        if (params.bodyParams) {\n            var ret = this.buildFormData(params.bodyParams);\n            if (ret.hasFile) {\n                requestHeaders.delete('Content-Type');\n                requestOptions.body = ret.formData;\n            }\n            else {\n                requestHeaders.set('Content-Type', _enums_content_type__WEBPACK_IMPORTED_MODULE_0__.XanoContentType.JSON);\n                requestOptions.body = JSON.stringify(ret.rawFormData);\n            }\n        }\n        var rawResponse;\n        return fetch(url.toString(), requestOptions).then(function (response) {\n            rawResponse = response;\n            switch (requestHeaders.get('Accept')) {\n                case _enums_content_type__WEBPACK_IMPORTED_MODULE_0__.XanoContentType.JSON: return response.json();\n                case _enums_content_type__WEBPACK_IMPORTED_MODULE_0__.XanoContentType.Text: return response.text();\n            }\n        }).then(function (data) {\n            var response = new _models_response__WEBPACK_IMPORTED_MODULE_3__.XanoResponse(rawResponse, data);\n            if (!rawResponse.ok) {\n                throw new _errors_request__WEBPACK_IMPORTED_MODULE_1__.XanoRequestError('There was an error with your request', response);\n            }\n            return response;\n        });\n    };\n    XanoClient.prototype.updateUrlWithParams = function (url, params) {\n        var urlParams = new URLSearchParams(url.search);\n        Object.keys(params).forEach(function (index) {\n            urlParams.set(index, params[index]);\n        });\n        url.search = urlParams.toString();\n    };\n    XanoClient.prototype.setAuthToken = function (authToken) {\n        this.config.authToken = authToken;\n        return this;\n    };\n    XanoClient.prototype.setResponseType = function (responseType) {\n        this.config.responseType = responseType;\n        return this;\n    };\n    XanoClient.prototype.delete = function (endpoint, params) {\n        return this.request({\n            bodyParams: params,\n            endpoint: endpoint,\n            method: _enums_request_type__WEBPACK_IMPORTED_MODULE_2__.XanoRequestType.DELETE,\n        });\n    };\n    XanoClient.prototype.get = function (endpoint, params) {\n        return this.request({\n            endpoint: endpoint,\n            method: _enums_request_type__WEBPACK_IMPORTED_MODULE_2__.XanoRequestType.GET,\n            urlParams: params,\n        });\n    };\n    XanoClient.prototype.head = function (endpoint, params) {\n        return this.request({\n            endpoint: endpoint,\n            method: _enums_request_type__WEBPACK_IMPORTED_MODULE_2__.XanoRequestType.HEAD,\n            urlParams: params,\n        });\n    };\n    XanoClient.prototype.patch = function (endpoint, params) {\n        return this.request({\n            bodyParams: params,\n            endpoint: endpoint,\n            method: _enums_request_type__WEBPACK_IMPORTED_MODULE_2__.XanoRequestType.PATCH,\n        });\n    };\n    XanoClient.prototype.post = function (endpoint, params) {\n        return this.request({\n            bodyParams: params,\n            endpoint: endpoint,\n            method: _enums_request_type__WEBPACK_IMPORTED_MODULE_2__.XanoRequestType.POST,\n        });\n    };\n    XanoClient.prototype.put = function (endpoint, params) {\n        return this.request({\n            bodyParams: params,\n            endpoint: endpoint,\n            method: _enums_request_type__WEBPACK_IMPORTED_MODULE_2__.XanoRequestType.PUT,\n        });\n    };\n    return XanoClient;\n}());\n\n\n\n//# sourceURL=webpack://js-sdk/./src/xano-client.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;