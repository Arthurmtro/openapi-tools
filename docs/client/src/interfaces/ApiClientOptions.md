[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ApiClientOptions

# Interface: ApiClientOptions

Defined in: [client/src/core/types.ts:161](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L161)

Extended API client options with authentication and interceptor support

This interface extends the common API client options with additional
configuration for authentication and interceptors.

## Example

```typescript
const clientOptions: ApiClientOptions = {
  // Base configuration
  baseUrl: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'X-App-Version': '1.0.0'
  },
  
  // HTTP client configuration
  httpClientType: 'fetch', // or 'axios'
  // Or provide a custom implementation
  // httpClient: customHttpClient,
  
  // Authentication
  auth: 'Bearer token123', // Static token
  // Or a function that returns a token (can be async)
  // auth: async () => getTokenFromStorage(),
  
  // Interceptors
  requestInterceptors: [
    (config) => ({ ...config, headers: { ...config.headers, 'X-Trace-ID': generateTraceId() } })
  ],
  responseInterceptors: [
    (response) => {
      console.log(`Response from ${response.config.url}: ${response.status}`);
      return response;
    }
  ],
  errorInterceptors: [
    (error) => {
      console.error('API error:', error);
      return Promise.reject(error);
    }
  ]
};
```

## Extends

- `ApiClientOptions`

## Properties

### auth?

> `optional` **auth**: `string` \| () => `string` \| `Promise`\<`string`\>

Defined in: [client/src/core/types.ts:186](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L186)

Authentication token or function that returns a token

This can be a static token string or a function that returns a token.
The function can be async, allowing for token refresh or retrieval from
storage or an authentication service.

#### Example

```typescript
// Static token
auth: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Function that returns a token
auth: () => localStorage.getItem('auth_token')

// Async function that fetches a token
auth: async () => {
  if (isTokenExpired()) {
    await refreshToken();
  }
  return getToken();
}
```

***

### errorInterceptors?

> `optional` **errorInterceptors**: [`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)[]

Defined in: [client/src/core/types.ts:216](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L216)

Error interceptors to be applied when requests or responses fail

These interceptors are applied in the order they are defined in the array.
Each interceptor can handle or transform errors before they are propagated.

#### See

ErrorInterceptor

***

### httpClient?

> `optional` **httpClient**: `HttpClient`

Defined in: [client/src/core/types.ts:227](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L227)

HTTP client to use for API requests

If provided, this HTTP client will be used instead of creating a new one.
This allows you to provide a custom HTTP client implementation that
conforms to the HttpClient interface.

#### See

HttpClient

#### Overrides

`CommonApiClientOptions.httpClient`

***

### httpClientType?

> `optional` **httpClientType**: `"fetch"` \| `"axios"`

Defined in: [client/src/core/types.ts:241](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L241)

Type of HTTP client to create if httpClient is not provided

This determines which built-in HTTP client implementation to use.

- 'fetch': Uses the native fetch API (default, zero dependencies)
- 'axios': Uses axios (requires axios to be installed)

If 'axios' is specified but not available, it will fall back to 'fetch'.

#### Default

```ts
'fetch'
```

***

### requestInterceptors?

> `optional` **requestInterceptors**: [`RequestInterceptor`](../type-aliases/RequestInterceptor.md)[]

Defined in: [client/src/core/types.ts:196](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L196)

Request interceptors to be applied before sending requests

These interceptors are applied in the order they are defined in the array.
Each interceptor can modify the request before it is sent.

#### See

RequestInterceptor

***

### responseInterceptors?

> `optional` **responseInterceptors**: [`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md)[]

Defined in: [client/src/core/types.ts:206](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L206)

Response interceptors to be applied after receiving responses

These interceptors are applied in the order they are defined in the array.
Each interceptor can modify the response before it is returned to the caller.

#### See

ResponseInterceptor
