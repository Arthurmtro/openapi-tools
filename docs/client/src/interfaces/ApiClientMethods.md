[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ApiClientMethods

# Interface: ApiClientMethods

Defined in: [client/src/core/types.ts:330](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L330)

Methods available on the API client

This interface defines the methods that are directly accessible on the 
API client instance created by `createApiClient`.

## Properties

### addErrorInterceptor()

> **addErrorInterceptor**: (`interceptor`) => `void`

Defined in: [client/src/core/types.ts:373](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L373)

Add an error interceptor

#### Parameters

##### interceptor

[`ErrorInterceptor`](../type-aliases/ErrorInterceptor.md)

The error interceptor function

#### Returns

`void`

***

### addRequestInterceptor()

> **addRequestInterceptor**: (`interceptor`) => `number`

Defined in: [client/src/core/types.ts:358](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L358)

Add a request interceptor

#### Parameters

##### interceptor

[`RequestInterceptor`](../type-aliases/RequestInterceptor.md)

The request interceptor function

#### Returns

`number`

An ID that can be used to remove the interceptor

***

### addResponseInterceptor()

> **addResponseInterceptor**: (`interceptor`) => `number`

Defined in: [client/src/core/types.ts:366](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L366)

Add a response interceptor

#### Parameters

##### interceptor

[`ResponseInterceptor`](../type-aliases/ResponseInterceptor.md)

The response interceptor function

#### Returns

`number`

An ID that can be used to remove the interceptor

***

### configure()

> **configure**: (`options`) => `void`

Defined in: [client/src/core/types.ts:336](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L336)

Reconfigure the client with new options

#### Parameters

##### options

[`ApiClientOptions`](ApiClientOptions.md)

New configuration options to apply

#### Returns

`void`

***

### getBaseUrl()

> **getBaseUrl**: () => `undefined` \| `string`

Defined in: [client/src/core/types.ts:343](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L343)

Get the base URL used for API requests

#### Returns

`undefined` \| `string`

The configured base URL or undefined if not set

***

### getHttpClient()

> **getHttpClient**: () => `HttpClient`

Defined in: [client/src/core/types.ts:350](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L350)

Get the HTTP client instance

#### Returns

`HttpClient`

The HTTP client instance used by this API client
