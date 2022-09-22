# Xano JavaScript SDK

The Xano JavaScript SDK is built in pure TypeScript with no external dependencies. Under
the hood the SDK uses [fetch](https://caniuse.com/fetch) which is supported by all modern browsers

[![npm version](https://img.shields.io/npm/v/@xano/js-sdk.svg?style=flat-square)](https://www.npmjs.com/package/@xano/js-sdk)

## What is Xano?

Xano is the fastest way to build a powerful, scalable backend for your app without code.

Xano gives you a scalable server, a flexible database, and a NO CODE API builder that can
transform, filter, and integrate with data from anywhere. We want to enable you to 
validate AND grow your ideas quickly without limits or any of the barriers you might 
have encountered using other tools. :muscle:

## Xano Links

- :globe_with_meridians: [Xano Homepage](https://xano.com/)
- :rocket: [Xano Documentation](https://docs.xano.com/)
- :book: [Xano Blog](https://www.xano.com/blog/)
- :house_with_garden: [Xano Community](https://community.xano.com/home)


## Installation

Use `npm` to install the Xano JS SDK module:

```sh
npm install @xano/js-sdk
```

OR use it directly from Unpkg:
```html
<script type="text/javascript" src="https://unpkg.com/@xano/js-sdk@latest/dist/xano.min.js"></script>
```

OR use our pre-bundled JS bundle:
```html
<script type="text/javascript" src="dist/xano.min.js"></script>
```

## Examples

Examples for all methods and simple use-cases can be found in the `/examples` folder.

## Usage

### `XanoClient`

This is the primary client class of Xano. It can be instantiated with the following parameters:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `apiGroupBaseUrl` | `string \| null` | `null` | API Group Base URL can be found on the API Group dashboard
| `authToken` | `string \| null` | `null` | Auth token generated in Xano from a login route (ex. /auth/login)
| `responseType` | `XanoResponseType` | `json` | values: `json`, `text`. The response type of the API whether it responds in JSON or Text

Usage: 
```js
import { XanoClient } from '@xano/js-sdk';

const xano = new XanoClient({
    'apiGroupBaseUrl': 'https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw'
});
```

### `XanoClient.setAuthToken`

Sets the authentication token which makes future requests authenticated.

| Param | Type | Description |
| --- | --- | --- |
| `authToken` | `string \| null` | Can be created from the /auth/login endpoint. Null will clear the token

Usage:
```js
xano.setAuthToken('eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBM....');
```

### `XanoClient.setResponseType`

Sets the response type you are expecting for the following requests.

| Param | Type | Values | Description |
| --- | --- | --- | --- |
| `responseType` | `XanoResponseType` | `json`, `text` | The expected response type

Usage in JS:
```js
xano.setResponseType('json');
```

Usage in TypeScript:
```typescript
xano.setResponseType(XanoResponseType.JSON);
```

### `XanoClient.get`

Makes a GET HTTP request to Xano.

This function returns a Promise that resolves to `XanoResponse` on success and `XanoRequestError` on failure.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`)
| `params` | `object` | `no` | URL params to attach to the request

Usage:
```js
xano.get('/users', {
    'sort_by': 'name'
}).then(
    (response) => {
        // Success!
    },
    (error) => {
        // Failure
    }
);
```

### `XanoClient.post`

Makes a POST HTTP request to Xano.

This function returns a Promise that resolves to `XanoResponse` on success and `XanoRequestError` on failure.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`)
| `params` | `object` | `no` | body params to attach to the request

Usage:
```js
xano.post('/users', {
    'first_name': 'Justin',
    'last_name': 'Albrecht'
}).then(
    (response) => {
        // Success!
    },
    (error) => {
        // Failure
    }
);
```

### `XanoClient.patch`

Makes a PATCH HTTP request to Xano.

This function returns a Promise that resolves to `XanoResponse` on success and `XanoRequestError` on failure.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`)
| `params` | `object` | `no` | body params to attach to the request

Usage:
```js
xano.patch('/users', {
    'first_name': 'Justin'
}).then(
    (response) => {
        // Success!
    },
    (error) => {
        // Failure
    }
);
```

### `XanoClient.put`

Makes a PUT HTTP request to Xano.

This function returns a Promise that resolves to `XanoResponse` on success and `XanoRequestError` on failure.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`)
| `params` | `object` | `no` | body params to attach to the request

Usage:
```js
xano.put('/users', {
    'last_name': 'Albrecht'
}).then(
    (response) => {
        // Success!
    },
    (error) => {
        // Failure
    }
);
```

### `XanoClient.delete`

Makes a DELETE HTTP request to Xano.

This function returns a Promise that resolves to `XanoResponse` on success and `XanoRequestError` on failure.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`)
| `params` | `object` | `no` | body params to attach to the request

Usage:
```js
xano.delete('/users/1', {
    'optional': 'abc'
}).then(
    (response) => {
        // Success!
    },
    (error) => {
        // Failure
    }
);
```

### `XanoClient.head`

Makes a HEAD HTTP request to Xano.

This function returns a Promise that resolves to `XanoResponse` on success and `XanoRequestError` on failure.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`)
| `params` | `object` | `no` | URL params to attach to the request

Usage:
```js
xano.head('/users/1', {
    'optional': 'abc'
}).then(
    (response) => {
        // Success!
    },
    (error) => {
        // Failure
    }
);
```

### `XanoResponse`

The response class of a successful `GET`/`POST`/`PATCH`/`PUT`/`DELETE`/`HEAD` request.

| Param | Type | Return Type | Description |
| --- | --- | --- | --- |
| `getBody` | `function` | `any` | If ResponseType is set to JSON it will be the JSON encoded result. If its set to text then the raw text is returned
| `getHeaders` | `function` | `object` | key/value pairs of the response headers
| `getStatusCode` | `function` | `number` | The status code of the HTTP request

Usage: 
```js
xano.get('/users').then(
    (response) => {
        const body = response.getBody();
        const headers = response.getHeaders();
        const statusCode = response.getStatusCode();
    }
);
```

### `XanoRequestError`

The response class of a failed GET/POST/PATCH/PUT/DELETE/HEAD request

This class extends the JS [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) class

| Param | Type | Return Type | Description |
| --- | --- | --- | --- |
| `getHttpResponse` | `function` | `XanoResponse` | Returns XanoResponse to get more information like HTTP status, headers, etc
| `message` | `string` | `string` | A generic human readable error message

Usage: 
```js
xano.get('/users').then(
    (response) => {

    },
    (error) => {
        const xanoHttpResponse = error.getHttpResponse();

        const body = xanoHttpResponse.getBody();
        const headers = xanoHttpResponse.getHeaders();
        const statusCode = xanoHttpResponse.getStatusCode();
    }
);
```

## TypeScript support

This package includes TypeScript declarations. We support projects 
using TypeScript versions >= 3.1.