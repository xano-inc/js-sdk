
# Xano JavaScript SDK
The Xano JavaScript SDK is built in pure TypeScript. Under the hood the SDK uses [Axios](https://github.com/axios/axios) which is not only supported by all modern browsers but allows us to be compatible with NodeJS as well.

Questions, comments or suggestions? Let us know in the [Xano Community](https://community.xano.com)

[![npm version](https://img.shields.io/npm/v/@xano/js-sdk.svg?style=flat-square)](https://www.npmjs.com/package/@xano/js-sdk)

## What is Xano?
Xano is the fastest way to build a powerful, scalable backend for your app without code. 

Xano gives you a scalable server, a flexible database, and a NO CODE API builder that can transform, filter, and integrate with data from anywhere. We want to enable you to validate AND grow your ideas quickly without limits or any of the barriers you might have encountered using other tools. :muscle:

## Xano Links
- :globe_with_meridians: [Xano Homepage](https://xano.com/)

- :rocket: [Xano Documentation](https://docs.xano.com/)

- :book: [Xano Blog](https://www.xano.com/blog/)

- :house_with_garden: [Xano Community](https://community.xano.com/)

## Installation
Include our script tag directly from jsDelivr:

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@xano/js-sdk@latest/dist/xano.min.js"></script>
```

OR use `npm` to install the Xano JS SDK module:
```sh
npm  install  @xano/js-sdk
```

OR use our pre-bundled JS bundle:
```html
<script  type="text/javascript"  src="dist/xano.min.js"></script>
```

## NodeJS
NodeJS users should use our `XanoNodeClient` instead of `XanoClient`. The documentation is the same, it just takes care of some inconsistencies from the web behind the scenes.

Since NodeJS isn't a browser, the `storage` configuration is defaulted to [XanoObjectStorage](#xanobasestorage).

## Examples
### Pre-baked Examples
Examples for all methods and simple use-cases can be found in the `/examples` folder.

### Uploading a file
Uploading a file can be a pretty complex process but we tried our best to make it as easy as possible - simply include the file as a parameter just like you would any other:
```js
const  file = document.getElementById("file").files[0];

xano.post("/file_upload", {
	file:  file,
}).then(
	(response) => {
		// Success!
	},
	(error) => {
		// Failure
	}
);
```

NodeJS users should refer to our [XanoFile](#xanofile) class.

### Connecting to Realtime
Connecting to realtime is as simple as supplying a channel name and listening for events. The client will automatically authenticate if the `authToken` setting is set.

```js
import { XanoClient, XanoSessionStorage } from  "@xano/js-sdk";

const  xano = new  XanoClient({
	instanceBaseUrl:  "https://x8ki-letl-twmt.n7.xano.io/",
	realtimeConnectionHash: "1lK90n16tnnylJpJ0Xa7Km6_KxA",
});

const channel = xano.channel("some_channel").on(function(command) {
	console.log("Received command", command);
});

channel.message({ message: "Hello world!" });
```

## Client Documentation
### `XanoClient`
This is the primary client class of Xano. It can be instantiated with the following parameters:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `apiGroupBaseUrl` | `string \| null` | `null` | API Group Base URL can be found on the API Group dashboard |
| `authToken` | `string \| null` | `null` | Auth token generated in Xano from a login route (ex. `/auth/login`). Depending on `storage` this value will persist when set/cleared |
| `customAxiosRequestConfig` | `Partial<AxiosRequestConfig>` | `{}` | For extreme edge cases, you can override the default Axios config that the SDK uses. [AxiosRequestConfig Documentation](https://axios-http.com/docs/req_config). Useful for ignoring SSL cert issues, etc |
| `dataSource` | `string \| null` | `null` | Name of the [Xano Data Source](https://docs.xano.com/database/data-sources) to use as the `X-Data-Source` header |
| `instanceBaseUrl` | `string \| null` | `null` | URL of the Xano instance to make requests to (ex. `https://x8ki-letl-twmt.n7.xano.io/`) |
| `realtimeConnectionHash` | `string \| null` | `null` | The connection hash found on the realtime settings panel within your instance workspace |
| `responseObjectPrefix` | `string \| null` | `null` | If the API response body is an object or an array of objects then this will prefix all keys with this value |
| `storage` | `XanoBaseStorage` | `XanoLocalStorage` | The storage mechanism where we store persistant information like `authToken` |

Usage:
```js
import { XanoClient } from  "@xano/js-sdk";

const  xano = new  XanoClient({
	apiGroupBaseUrl:  "https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw",
});
```

### `XanoClient.hasAuthToken`
Checks to see if the `authToken` has been set.

Usage:
```js
xano.setAuthToken("eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBM....");

console.log(xano.hasAuthToken()); // true
```

### `XanoClient.setAuthToken`
Sets the authentication token which makes future requests authenticated.

Depending on `storage` when configuring `XanoClient` this value could persist across browser reloads.

| Param | Type | Description |
| --- | --- | --- |
| `authToken` | `string \| null` | Can be created from the `/auth/login` endpoint. `null` will clear the token |

Usage:
```js
xano.setAuthToken("eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBM....");
```

### `XanoClient.hasDataSource`
Checks to see if the `dataSource` has been set.

Usage:
```js
xano.setDataSource("develop");

console.log(xano.hasDataSource()); // true
```

### `XanoClient.setDataSource`
Sets the data source which makes future requests include the `X-Data-Source` header.

More information about data sources can be [found here](https://docs.xano.com/database/data-sources)

| Param | Type | Description |
| --- | --- | --- |
| `dataSource` | `string \| null` | The name of the data source to use |

Usage:
```js
xano.setDataSource("develop");
```

### `XanoClient.get`
Makes a GET HTTP request to Xano.

This function returns a Promise that resolves to `XanoResponse` on success and `XanoRequestError` on failure.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`) |
| `params` | `object` | `no` | URL params to attach to the request |
| `headers` | `object` | `no` | Key/value pair of headers to send with the request |

Usage:
```js
xano.get("/users", {
	sort_by:  "name",
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
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`) |
| `params` | `object` | `no` | body params to attach to the request |
| `headers` | `object` | `no` | Key/value pair of headers to send with the request |

Usage:
```js
xano.post("/users", {
	first_name:  "Justin",
	last_name:  "Albrecht",
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
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`) |
| `params` | `object` | `no` | body params to attach to the request |
| `headers` | `object` | `no` | Key/value pair of headers to send with the request |

Usage:
```js
xano.patch("/users", {
	first_name:  "Justin",
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
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`) |
| `params` | `object` | `no` | body params to attach to the request |
| `headers` | `object` | `no` | Key/value pair of headers to send with the request |

Usage:
```js
xano.put("/users", {
	last_name:  "Albrecht",
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
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`) |
| `params` | `object` | `no` | body params to attach to the request |
| `headers` | `object` | `no` | Key/value pair of headers to send with the request |

Usage:
```js
xano.delete("/users/1", {
	optional:  "abc",
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
| `endpoint` | `string` | `yes` | The endpoint starting with a `/` (ex. `/users`) |
| `params` | `object` | `no` | URL params to attach to the request |
| `headers` | `object` | `no` | Key/value pair of headers to send with the request |

Usage:
```js
xano.head("/users/1", {
	optional:  "abc",
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

| Function | Params | Return Type | Description |
| --- | --- | --- | --- |
| `getBody` | `objectPrefix: string` | `any` | <ul><li>If the API response is JSON it will be the JSON encoded result</li><li>If the API response is text then it will be the text result</li><li>If `objectPrefix` is set and the response is a JSON object or an array of objects then all keys will be prefixed with this value</li><li>`objectPrefix` will take priority over setting it on `XanoClient` through `responseObjectPrefix`</li></ul> |
| `getHeaders` | | `object` | key/value pairs of the response headers |
| `getStatusCode` | | `number` | The status code of the HTTP request |

Usage:
```js
xano.get("/users").then((response) => {
	const  body = response.getBody();
	const  headers = response.getHeaders();
	const  statusCode = response.getStatusCode();
});
```

### `XanoRequestError`
The response class of a failed `GET`/`POST`/`PATCH`/`PUT`/`DELETE`/`HEAD` request.

This class extends the JS [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) class.

| Param | Type | Return Type | Description |
| --- | --- | --- | --- |
| `getResponse` | `function` | `XanoResponse` | Returns XanoResponse to get more information like HTTP status, headers, etc |
| `message` | `string` | `string` | A generic human readable error message |

Usage:
```js
xano.get("/users").then(
	(response) => {},
	(error) => {
		const  xanoHttpResponse = error.getResponse();
		const  body = xanoHttpResponse.getBody();
		const  headers = xanoHttpResponse.getHeaders();
		const  statusCode = xanoHttpResponse.getStatusCode();
	}
);
```

### `XanoFile`
`XanoFile` is a class for NodeJS only!

The `XanoFile` class is required to upload a file from the NodeJS file system.

| Param | Type | Description |
| --- | --- | --- |
| `name` | `string` | The name of the file |
| `buffer` | `Buffer` | Buffer of the file |

Usage:
```js
const  fs = require("fs/promises");
const  fileName = "512x512bb.jpg";

fs.readFile("./" + fileName).then(
	(imageBuffer) => {
		const  xImage = new  XanoFile(fileName, imageBuffer);

		xano.post("/file_upload", {
			image:  xImage,
		}).then(
			(response) => {
				// Success!
			},
			(error) => {
				// Error
			}
		);
	}
);
```

### `XanoBaseStorage`
The `XanoBaseStorage` class is extended for storing/retrieving information like the `authToken`.

Xano supplies four Storage classes by default:

| Class Name | Storage Mechanism | Persistant | NodeJS Compatible
| --- | --- | --- | --- |
| `XanoCookieStorage` | `document.cookie` | `yes` | `no`
| `XanoLocalStorage` | `localStorage` | `yes` | `no`
| `XanoSessionStorage` | `sessionStorage` | `yes` | `no`
| `XanoObjectStorage` | `Object` | `no` | `yes`

Each class that extends `XanoBaseStorage` share the following functions:

| Function | Params | Return Type | Description |
| --- | --- | --- | --- |
| `clear` | | `void` | Clears all storage keys |
| `getAll` | | `Record<string, string>` | Returns all data stored in `XanoBaseStorage` |
| `getItem` | `key: string` | `string \| null` | Returns the value for the `key`, or `null` if not set |
| `removeItem` | `key: string` | `void` | Removes the `key` and `value` from storage |
| `setItem` | `key: string`, `value: string` | `void` | Updates storage for `key` with `value` |

Usage:
```js
import { XanoClient, XanoSessionStorage } from  "@xano/js-sdk";

const  xano = new  XanoClient({
	apiGroupBaseUrl:  "https://x8ki-letl-twmt.n7.xano.io/api:jVuUQATw",
	storage:  new  XanoSessionStorage(),
});
```

## Realtime Documentation
Every Xano instance comes with a realtime socket server that can be enabled on a per-workspace basis that supports Xano to client messaging, client to public channel messaging, client to private channel messaging, and client to client (private) messaging.

### `XanoClient.channel`
Connects the `XanoClient` to a realtime websocket channel.

This function returns an instance of `XanoRealtimeChannel`

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `channel` | `string` | `yes` | The channel name you want to join |
| `options` | `Partial<IRealtimeChannelOptions` | `no` | Channel options to connect to the channel with |

Usage:
```js
const channel = xano.channel("stats", {
	presence:  true,
});
```

### XanoRealtimeChannel.on
The `on` returns an event stream that can be subscribed two with a success and error function:

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `onMessage` | `CallableFunction<XanoRealtimeCommand>` | `yes` | A callback function that gets called when the channel receives a message |
| `onError` | `CallableFunction<XanoRealtimeCommand>` | `no` | A callback function that gets called when the channel receives an error message |

Usage:
```js
channel.on(
	(message) => {
		// Success!
	},
	(error) => {
		// Failure
	}
);
```

### XanoRealtimeChannel.message
Sends a message from the client to the channel

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `payload` | `any` | `yes` | Any JSON stringable message to send to the channel |
| `commandOptions` | `Partial<XanoRealtimeCommandOptions>` | `no` | Message options to send with the message |

Usage:
```js
// Send a message to only other authenticated users in a channel
channel.message({ message: "Hello world!" }, {
	authenticated: true
});
```

### XanoRealtimeChannel.getPresence
Sends a message from the client to the channel. 

Presence is only available on channels joined with `XanoRealtimeChannelOptions.presence` set to `true`

Returns an array of `XanoRealtimeClient`

Usage:
```js
const users = channel.getPresence();
```

### XanoRealtimeChannel.destroy
Leaves the channel and disconnects from the realtime websocket server if its the last open channel. You will need to create a new `XanoRealtimeChannel` instance to rejoin or interact with the channel again.

Usage:
```js
channel.destroy();
```

### XanoRealtimeClient.message
Sends a private message directly to the `XanoRealtimeClient` client.

Usage:
```js
const presence = channel.getPresence();

for (const client of presence) {
	client.message({ message: "Saying hello to everyone in private!" });
}
```

### XanoRealtimeChannelOptions
Leaves the channel and disconnects from the realtime websocket server if its the last open channel. You will need to create a new `XanoRealtimeChannel` instance to rejoin or interact with the channel again.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `presence` | `boolean` | `false` | Subscribes to channel presence to see who else is in the channel and events when others join/leave |
| `queueOfflineCommands` | `boolean` | `true` | In the event of a disconnect, or when sending commands before the channel connection is established, commands will be put in a queue and sent as soon as the connection is established |

### XanoRealtimeClient
Presence user or initiator of a command

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `extras` | `Record<string, any>` | `{}` | When authenticated this is the extras that are configured with the auth token |
| `permissions` | `Record<{ dbo_id: number; row_id: number}>` | `{ dbo_id: 0, row_id: 0}` | Permissions are set through the `authToken` supplied when configuring `XanoClient`. `dbo_id` is the table ID that the client is authenticated with, `row_id` is the row of the client |
| `socketId` | `string` | | Internal socket ID used for sending private commands |

### XanoRealtimeCommand
The command payload sent and received through the `XanoRealtimeChannel`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `client?` | `XanoRealtimeClient` | `{}` | The authenticated client that initiated the command |
| `command` | `ERealtimeCommand` | | The command sent/received |
| `commandOptions` | `XanoRealtimeCommandOptions` | | Options sent with the command |
| `payload` | `Record<string, any>` | | The payload sent with the command |

### XanoRealtimeCommandOptions
The command options when sending and receiving commands through the `XanoRealtimeChannel.message`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `authenticated?` | `boolean` | `false` | If the command received is for authenticated clients only |
| `channel` | `string` | | The channel name that the command is intended for |
| `socketId` | `string` | | The socketId for the recipient or sender of the command |

## TypeScript support
This package includes TypeScript declarations. We support projects using TypeScript versions >= 3.1.