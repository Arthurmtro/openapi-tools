[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ApiClient

# Class: ApiClient\<T\>

Defined in: [client/src/api/api-client.ts:39](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L39)

API client that provides access to OpenAPI-defined endpoints with advanced features

The `ApiClient` is the core class that handles API communication, authentication,
and interceptor management. It creates instances of API endpoints defined in OpenAPI
specifications and provides a unified interface for making API requests.

Features:
- Pluggable HTTP client architecture (fetch, axios, or custom implementations)
- Built-in authentication support
- Request/response interceptors
- Error handling
- Automatic endpoint initialization

## Type Parameters

### T

`T` *extends* [`ApiEndpoints`](../interfaces/ApiEndpoints.md)

The type of API endpoints this client will manage

## Constructors

### Constructor

> **new ApiClient**\<`T`\>(`endpoints`, `options`): `ApiClient`\<`T`\>

Defined in: [client/src/api/api-client.ts:70](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L70)

Creates a new API client instance with the specified endpoints and options

The constructor initializes the HTTP client, sets up interceptors, and
initializes API endpoint instances.

#### Parameters

##### endpoints

`Record`\<`string`, [`ApiEndpoint`](../interfaces/ApiEndpoint.md) \| [`ApiEndpointConstructor`](../type-aliases/ApiEndpointConstructor.md) \| [`AnyEndpointClass`](../type-aliases/AnyEndpointClass.md)\>

A record of API endpoint constructors or instances to initialize

##### options

[`ApiClientOptions`](../interfaces/ApiClientOptions.md) = `{}`

Configuration options for the API client

#### Returns

`ApiClient`\<`T`\>

#### Example

```typescript
// Create a client with PetApi and UserApi endpoints
const client = new ApiClient(
  { 
    pets: PetApi,
    users: UserApi
  },
  { 
    baseUrl: 'https://api.example.com',
    httpClientType: 'fetch',
    auth: async () => getAuthToken()
  }
);
```

## API Client

### api

#### Get Signature

> **get** **api**(): `T`

Defined in: [client/src/api/api-client.ts:557](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L557)

Gets access to the API endpoints

This property provides access to all initialized API endpoints.
It's primarily used internally by the proxy created in `createApiClient`.

##### Returns

`T`

An object containing all initialized API endpoints

***

### addErrorInterceptor()

> **addErrorInterceptor**(`interceptor`): `void`

Defined in: [client/src/api/api-client.ts:520](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L520)

Adds an error interceptor to the API client

Error interceptors allow handling or transforming errors that occur
during request or response processing. They are executed in the order
they are added.

#### Parameters

##### interceptor

[`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)

The error interceptor function

#### Returns

`void`

#### Example

```typescript
// Log errors
client.addErrorInterceptor((error) => {
  console.error('API Error:', error);
  return Promise.reject(error); // Re-throw the error
});

// Transform error objects
client.addErrorInterceptor((error) => {
  // Add a timestamp to the error
  const enhancedError = {
    ...error,
    timestamp: new Date().toISOString()
  };
  return Promise.reject(enhancedError);
});

// Retry on specific errors
client.addErrorInterceptor(async (error) => {
  if (error.status === 401) {
    // Refresh token and retry
    await refreshToken();
    // The original request will be retried
  }
  return Promise.reject(error);
});
```

***

### addRequestInterceptor()

> **addRequestInterceptor**(`interceptor`): `number`

Defined in: [client/src/api/api-client.ts:430](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L430)

Adds a request interceptor to the HTTP client

Request interceptors allow modifying or logging request configurations
before they are sent to the server. They are executed in the order
they are added.

#### Parameters

##### interceptor

[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)

The request interceptor function

#### Returns

`number`

An ID that can be used to remove the interceptor

#### Example

```typescript
// Add a request logger
client.addRequestInterceptor((config) => {
  console.log(`Making request to ${config.url}`);
  return config;
});

// Add headers to every request
client.addRequestInterceptor((config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Custom-Header': 'value'
    }
  };
});
```

***

### addResponseInterceptor()

> **addResponseInterceptor**(`interceptor`): `number`

Defined in: [client/src/api/api-client.ts:470](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L470)

Adds a response interceptor to the HTTP client

Response interceptors allow modifying or logging responses
after they are received from the server but before they are
returned to the caller. They are executed in the order they are added.

#### Parameters

##### interceptor

[`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md)

The response interceptor function

#### Returns

`number`

An ID that can be used to remove the interceptor

#### Example

```typescript
// Add a response logger
client.addResponseInterceptor((response) => {
  console.log(`Received response with status ${response.status}`);
  return response;
});

// Transform response data
client.addResponseInterceptor((response) => {
  if (response.data && typeof response.data === 'object') {
    // Add a timestamp to all responses
    response.data.receivedAt = new Date().toISOString();
  }
  return response;
});
```

***

### configure()

> **configure**(`options`): `void`

Defined in: [client/src/api/api-client.ts:373](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L373)

Reconfigures the client with new options

This method allows updating the client configuration after initialization.
It merges the new options with existing ones and, if necessary, creates
a new HTTP client and reinitializes endpoints.

#### Parameters

##### options

[`ApiClientOptions`](../interfaces/ApiClientOptions.md)

New configuration options to apply

#### Returns

`void`

#### Example

```typescript
// Update the base URL and authentication
client.configure({
  baseUrl: 'https://api-v2.example.com',
  auth: 'new-auth-token'
});
```

***

### getBaseUrl()

> **getBaseUrl**(): `undefined` \| `string`

Defined in: [client/src/api/api-client.ts:531](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L531)

Gets the base URL used for API requests

#### Returns

`undefined` \| `string`

The configured base URL or undefined if not set

***

### getHttpClient()

> **getHttpClient**(): `HttpClient`

Defined in: [client/src/api/api-client.ts:544](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L544)

Gets the HTTP client instance used by this API client

This can be useful for advanced use cases where you need direct
access to the underlying HTTP client.

#### Returns

`HttpClient`

The HTTP client instance
