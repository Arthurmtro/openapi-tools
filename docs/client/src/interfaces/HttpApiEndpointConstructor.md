[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / HttpApiEndpointConstructor

# Interface: HttpApiEndpointConstructor

Defined in: [client/src/core/types.ts:277](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L277)

Constructor type for API endpoints that use our HttpClient interface

This interface represents the constructor for API endpoints that accept
our HttpClient interface directly.

## Constructors

### Constructor

> **new HttpApiEndpointConstructor**(`configuration`?, `basePath`?, `httpClient`?): [`ApiEndpoint`](ApiEndpoint.md)

Defined in: [client/src/core/types.ts:278](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L278)

#### Parameters

##### configuration?

`unknown`

##### basePath?

`string`

##### httpClient?

`HttpClient`

#### Returns

[`ApiEndpoint`](ApiEndpoint.md)
