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

OR use it directly from Unpkg (replace VERSION with the npm version found at the top of this page):
```html
<script type="text/javascript" src="https://unpkg.com/@xano/js-sdk@VERSION/dist/xano.min.js"></script>
```

OR use our pre-bundled JS bundle:
```html
<script type="text/javascript" src="dist/xano.min.js"></script>
```

## Examples

Examples for all methods and simple use-cases can be found in the `examples/` folder

## Usage

### `XanoClient`

This is the primary client class of Xano. It can be instantiated with the following parameters:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `apiGroupBaseUrl` | string \| null | null | API Group Base URL can be found on the API Group dashboard
| `authToken` | string \| null | null | Auth token generated in Xano from a login route (ex. /auth/login)
| `responseType` | XanoResponseType | json | values: json or text. The response type of the API whether it responds in JSON or Text |

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
| `authToken` | string \| null | Can be created from the /auth/login endpoint. Null will clear the token

Usage:
```js
xano.setAuthToken('eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBM....');
```

### `XanoClient.setResponseType`

Sets the response type you are expecting for the following requests.

| Param | Type | Values | Description |
| --- | --- | --- | --- |
| `responseType` | XanoResponseType | json, text | The expected response type

Usage in JS:
```js
xano.setResponseType('json');
```

Usage in TypeScript:
```TypeScript
xano.setResponseType(XanoResponseType.JSON);
```

### `XanoClient.get`

Makes a GET HTTP request to Xano

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | string | yes | The endpoint starting with a `/` (ex. `/users`)
| `params` | object | no | URL params to attach to the request

Usage:
```js
xano.get('/users', {
    'sort_by': 'name'
});
```

### `XanoClient.post`

Makes a POST HTTP request to Xano

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | string | yes | The endpoint starting with a `/` (ex. `/users`)
| `params` | object | no | body params to attach to the request

Usage:
```js
xano.post('/users', {
    'first_name': 'Justin',
    'last_name': 'Albrecht'
});
```

### `XanoClient.patch`

Makes a PATCH HTTP request to Xano

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | string | yes | The endpoint starting with a `/` (ex. `/users`)
| `params` | object | no | body params to attach to the request

Usage:
```js
xano.patch('/users', {
    'first_name': 'Justin'
});
```

### `XanoClient.put`

Makes a PUT HTTP request to Xano

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | string | yes | The endpoint starting with a `/` (ex. `/users`)
| `params` | object | no | body params to attach to the request

Usage:
```js
xano.put('/users', {
    'last_name': 'Albrecht'
});
```

### `XanoClient.delete`

Makes a DELETE HTTP request to Xano

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | string | yes | The endpoint starting with a `/` (ex. `/users`)
| `params` | object | no | body params to attach to the request

Usage:
```js
xano.delete('/users/1', {
    'optional': 'abc'
});
```

### `XanoClient.head`

Makes a HEAD HTTP request to Xano

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | string | yes | The endpoint starting with a `/` (ex. `/users`)
| `params` | object | no | URL params to attach to the request

Usage:
```js
xano.head('/users/1', {
    'optional': 'abc'
});
```

## TypeScript support

This package includes TypeScript declarations. We support projects 
using TypeScript versions >= 3.1.