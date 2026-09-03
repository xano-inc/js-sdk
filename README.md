
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

The client also **reconnects and re-joins your channels automatically** if the connection drops — see [Automatic reconnection](#automatic-reconnection).

```js
import { XanoClient, XanoSessionStorage } from  "@xano/js-sdk";

const  xano = new  XanoClient({
	instanceBaseUrl:  "https://x8ki-letl-twmt.n7.xano.io/",
	realtimeConnectionCanonical: "1lK90n16tnnylJpJ0Xa7Km6_KxA",
});

const channel = xano.channel("some_channel");

// Listening to all events
channel.on(function(action) {
	console.log("Received action", action);
});

// Listening to specific events (full list in src/enums/realtime-action.ts)
channel.on("message", function(action) {
	console.log("Received message", action);
});

channel.message({ message: "Hello world!" });
```

**On Realtime v2**, add `realtimeVersion: 2` and name the message object that handles what you publish. Everything else is the same:

```js
const  xano = new  XanoClient({
	instanceBaseUrl:  "https://x8ki-letl-twmt.n7.xano.io/",
	realtimeConnectionCanonical: "rtmain01",
	realtimeVersion: 2,
});

const channel = xano.channel("lobby", { messageType: "say" });

channel.on("message", function(action) {
	console.log("Received message", action);
});

channel.message({ text: "Hello world!" });
```

Not sure which one you are on? See [Realtime v1 vs v2](#realtime-v1-vs-v2).

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
| `realtimeAuthToken` | `string \| null` | `null` | Auth token used when connecting to realtime. **NOTICE:** If not present, it will default to `authToken` until sunset on July 1st, 2024, then it will be required for realtime authentication. [More details...](https://docs.xano.com/building-features/realtime#xano-auth--realtime) |
| `realtimeConnectionCanonical` | `string \| null` | `null` | The connection canonical found on the realtime settings panel within your instance workspace |
| `realtimeConnectionHash` | `string \| null` | `null` | **Deprecated.** Use `realtimeConnectionCanonical` instead. Still supported for backwards compatibility |
| `realtimeVersion` | `1 \| 2` | `1` | Which realtime tier to connect to. Leave unset for v1. Set to `2` for a workspace using [Realtime v2](#realtime-v1-vs-v2) |
| `realtimeClientId` | `string \| null` | `null` | **v2 only.** Stable client identity used to resume after a reconnect. Generated automatically if omitted; supply your own (persisted in `localStorage`) to also resume across a page reload |
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

### `XanoClient.hasRealtimeAuthToken`
Checks to see if the `realtimeAuthToken` has been set.

Usage:
```js
xano.setRealtimeAuthToken("eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBM....");

console.log(xano.hasRealtimeAuthToken()); // true
```

### `XanoClient.setRealtimeAuthToken`
Sets the realtime authentication token which is used on new realtime connections.

Depending on `storage` when configuring `XanoClient` this value could persist across browser reloads.

| Param | Type | Description |
| --- | --- | --- |
| `authToken` | `string \| null` | Can be created from the `/auth/login` endpoint. `null` will clear the token |

Usage:
```js
xano.setRealtimeAuthToken("eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBM....");
xano.realtimeReconnect();
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

### Realtime v1 vs v2

Xano has **two realtime implementations**, and they are different services. This SDK speaks both.

**Which one am I on?** A workspace is on **v2** if it has an enabled **realtime server** (with a canonical) under Realtime in your workspace. If you configure realtime with only a connection canonical from the older realtime settings panel, you are on **v1**. The two never serve the same workspace at once, so this is a per-app setting — the client cannot detect it for you.

```js
// v1 — the default. Nothing changes for existing apps.
const xano = new XanoClient({
	instanceBaseUrl: "https://x8ki-letl-twmt.n7.xano.io/",
	realtimeConnectionCanonical: "1lK90n16tnnylJpJ0Xa7Km6_KxA",
});

// v2 — opt in explicitly.
const xano = new XanoClient({
	instanceBaseUrl: "https://x8ki-letl-twmt.n7.xano.io/",
	realtimeConnectionCanonical: "rtmain01",
	realtimeVersion: 2,
});
```

**`realtimeVersion` defaults to `1`, so upgrading the SDK changes nothing for an existing v1 app.**

#### What differs

Most of the API is identical — `channel()`, `on()`, `message()`, `getPresence()` and `destroy()` work the same on both. The differences:

| | v1 | v2 |
| --- | --- | --- |
| Publishing | `channel.message(payload)` | `channel.message(payload)` — but the channel needs a [`messageType`](#xanorealtimechanneloptions) naming which message object handles it |
| Presence members | keyed per **socket** | keyed per **identity**, so two tabs of one user collapse to a single member |
| Guaranteed delivery | not available | `at_least_once` channels — messages missed while offline are redelivered through your normal `message` handler |
| Message history | `channel.history()` | replayed automatically on join (channel `conversation` setting) |

Everything else — reconnect behaviour, event names you subscribe to, error handling — is the same.

### Automatic reconnection

**The SDK reconnects on its own, on both v1 and v2.** You do not need to write reconnect logic.

If a connection drops abnormally — a deploy, a pod restart, a network blip, an idle timeout — the client:

1. reconnects with exponential backoff (1s, doubling, capped at 60s),
2. **re-joins every channel you had joined**, and
3. on v2, resumes your position so messages you missed while offline are redelivered.

This is automatic. Your `on()` handlers stay attached across a reconnect and keep firing.

The close codes that trigger a reconnect are `1006` (abnormal closure), `1011`, `1012`, `1013`, `1014`, and `4000`. A clean close — `channel.destroy()`, or code `1000` — deliberately does **not** reconnect.

You can observe it if you want to reflect connection state in your UI:

```js
channel.on("connection_status", function(action) {
	// action.payload.status is "connected" or "disconnected"
	setOnline(action.payload.status === "connected");
});
```

#### Resuming missed messages (v2)

On a v2 channel with `delivery.guarantee = at_least_once`, reconnecting also replays what you missed. That is keyed on a **stable client id**, which the SDK generates and reuses automatically for the life of the page.

To resume across a **page reload** as well, persist the id yourself:

```js
let clientId = localStorage.getItem("xano_client_id");
if (!clientId) {
	clientId = crypto.randomUUID();
	localStorage.setItem("xano_client_id", clientId);
}

const xano = new XanoClient({
	instanceBaseUrl: "https://x8ki-letl-twmt.n7.xano.io/",
	realtimeConnectionCanonical: "rtmain01",
	realtimeVersion: 2,
	realtimeClientId: clientId,
});
```

**Redelivered messages arrive through your normal `message` handler.** There is no separate replay handler to write and no second code path to keep in sync — a message you missed is the same message, so it is delivered the same way:

```js
channel.on("message", function(action) {
	// Fires for live messages AND for ones redelivered after a reconnect.
	render(action.payload);
});
```

If a replay genuinely needs different treatment — suppressing a notification sound, say — branch on the marker:

```js
channel.on("message", function(action) {
	render(action.payload);
	if (!action.replayed) {
		playSound();
	}
});
```

Acknowledgement is automatic too: the SDK advances the cursor after your handlers have run, so a handler that **throws** leaves the message unacknowledged and it is redelivered next time. Take over with [`manualAck`](#xanorealtimechanneloptions) if "handled" means something the SDK cannot see, like persisted to your own database:

```js
const channel = xano.channel("orders", { manualAck: true });

channel.on("message", async function(action) {
	await db.save(action.payload);
	channel.ack(action.id);
});
```

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

### `XanoClient.realtimeReconnect`
If you are connected to the realtime websocket server this will trigger a reconnect. This function is usefull after updating your `realtimeAuthToken` to trigger re-authentication.

Usage:
```js
xano.setRealtimeAuthToken("eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBM....");
xano.realtimeReconnect();
```

### XanoRealtimeChannel.on (all events)
The `on` returns an event stream that can be subscribed to with a success and error function:

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `onAction` | `CallableFunction<XanoRealtimeAction>` | `yes` | A callback function that gets called when the channel receives an action |
| `onError` | `CallableFunction<XanoRealtimeAction>` | `no` | A callback function that gets called when the channel receives an error message |

Usage:
```js
channel.on(
	(action) => {
		// Success!
	},
	(error) => {
		// Failure
	}
);
```

### XanoRealtimeChannel.on (specific events)
The `on` returns an event stream that can be subscribed to with an action, success function, and error function:

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `action` | `ERealtimeAction` | `yes` | The action you want to subscribe to |
| `onAction` | `CallableFunction<XanoRealtimeAction>` | `yes` | A callback function that gets called when the channel receives an action |
| `onError` | `CallableFunction<XanoRealtimeAction>` | `no` | A callback function that gets called when the channel receives an error message |

Usage:
```js
// Using the string action
channel.on("message", 
	(action) => {
		// Success!
	},
	(error) => {
		// Failure
	}
);

// Using the typescript enum:
channel.on(ERealtimeAction.Message, 
	(action) => {
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
| `payload` | `any` | `yes` | Any JSON stringable payload to send to the channel |
| `options` | `Partial<XanoRealtimeActionOptions>` | `no` | Action options to send with the action |

Usage:
```js
// Send a message to only other authenticated users in a channel
channel.message({ message: "Hello world!" }, {
	authenticated: true
});
```

### XanoRealtimeChannel.ack
**v2 only.** Advances this client's durable cursor on an `at_least_once` channel, marking everything up to that message as handled. The cursor is what bounds the [replay after a reconnect](#resuming-missed-messages-v2).

**You normally do not call this** — the SDK acks automatically once your handlers have run. Use it with the [`manualAck`](#xanorealtimechanneloptions) channel option when acknowledgement should wait for something the SDK cannot observe, such as a database write.

No-op on v1 and on channels without `at_least_once` delivery.

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `cursor` | `string` | `yes` | The stream id of the handled message, available as `action.id` |

Usage:
```js
const channel = xano.channel("orders", { manualAck: true });

channel.on("message", async function(action) {
	await db.save(action.payload);
	channel.ack(action.id);
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

### XanoRealtimeChannel.history
Sends a message to realtime requesting the latest channel history. The response will be sent through the history action

History is only available on channels with message history enabled

Usage:
```js
channel.history();

channel.on('history', function(action) {
	console.log('history', action);
});
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

### XanoRealtimeClient.history
Sends a message to realtime requesting the latest channel history. The response will be sent through the history action

History is only available on channels with message history enabled

Usage:
```js
client.history();

channel.on('history', function(action) {
	console.log('history', action);
});
```

### XanoRealtimeChannelOptions
Leaves the channel and disconnects from the realtime websocket server if its the last open channel. You will need to create a new `XanoRealtimeChannel` instance to rejoin or interact with the channel again.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `history` | `boolean` | `false` | Returns the channel message history on join (if its enabled on a channel)
| `presence` | `boolean` | `false` | Subscribes to channel presence to see who else is in the channel and events when others join/leave |
| `queueOfflineActions` | `boolean` | `true` | In the event of a disconnect, or when sending actions before the channel connection is established, actions will be put in a queue and sent as soon as the connection is established |
| `messageType` | `string` | | **v2 only.** The channel message object that handles what you publish with `channel.message()`. A v2 channel can define several messages, so there is no default — set the one this channel should route to |
| `manualAck` | `boolean` | `false` | **v2 only.** Stop the SDK acking each message after your handlers run, and call [`channel.ack()`](#xanorealtimechannelack) yourself instead. Use when "handled" means something the SDK cannot see, like a completed database write |

### XanoRealtimeAction.id
**v2 only.** Delivered messages carry an `id` — the stream id of that message on an `at_least_once` channel. You only need it with [`manualAck`](#xanorealtimechanneloptions).

### XanoRealtimeAction.replayed
**v2 only.** `true` when a message is being redelivered because it was missed while disconnected. Replays arrive through the **normal `message` handler**, so this is only for the rare case where a replay should be treated differently from a live message.

### XanoRealtimeClient
Presence user or initiator of a action

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `extras` | `Record<string, any>` | `{}` | When authenticated this is the extras that are configured with the auth token |
| `permissions` | `Record<{ dbo_id: number; row_id: number}>` | `{ dbo_id: 0, row_id: 0}` | Permissions are set through the `authToken` supplied when configuring `XanoClient`. `dbo_id` is the table ID that the client is authenticated with, `row_id` is the row of the client |
| `socketId` | `string` | | Internal socket ID used for sending private actions |

### XanoRealtimeAction
The action payload sent and received through the `XanoRealtimeChannel`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `client?` | `XanoRealtimeClient` | `{}` | The authenticated client that initiated the action |
| `action` | `ERealtimeAction` | | The action sent/received |
| `options` | `XanoRealtimeActionOptions` | | Options sent with the action |
| `payload` | `Record<string, any>` | | The payload sent with the action |

### XanoRealtimeActionOptions
The action options when sending and receiving actions through the `XanoRealtimeChannel.message`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `authenticated?` | `boolean` | `false` | If the action received is for authenticated clients only |
| `channel` | `string` | | The channel name that the action is intended for |
| `socketId` | `string` | | The socketId for the recipient or sender of the action |

## TypeScript support
This package includes TypeScript declarations. We support projects using TypeScript versions >= 3.1.