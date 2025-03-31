[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [common/src](../README.md) / ApiClientOptions

# Interface: ApiClientOptions

Defined in: [common/src/types.ts:21](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/types.ts#L21)

API client options extending HTTP client configuration

## Extends

- `HttpClientConfig`

## Properties

### baseUrl?

> `optional` **baseUrl**: `string`

Defined in: [common/src/http/types.ts:5](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/types.ts#L5)

#### Inherited from

`HttpClientConfig.baseUrl`

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [common/src/http/types.ts:7](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/types.ts#L7)

#### Inherited from

`HttpClientConfig.headers`

***

### httpClient?

> `optional` **httpClient**: `HttpClient`

Defined in: [common/src/types.ts:26](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/types.ts#L26)

HTTP client implementation to use
If not provided, defaults to Fetch

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [common/src/http/types.ts:6](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/types.ts#L6)

#### Inherited from

`HttpClientConfig.timeout`

***

### withCredentials?

> `optional` **withCredentials**: `boolean`

Defined in: [common/src/http/types.ts:8](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/types.ts#L8)

#### Inherited from

`HttpClientConfig.withCredentials`
