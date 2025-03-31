[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [common/src](../README.md) / createHttpClient

# Function: createHttpClient()

> **createHttpClient**(`type`, `config`): [`HttpClient`](../interfaces/HttpClient.md)

Defined in: [common/src/http/core/http-client.ts:11](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/core/http-client.ts#L11)

Creates the appropriate HTTP client based on the specified type

## Parameters

### type

The type of HTTP client to create

`"fetch"` | `"axios"`

### config

[`HttpClientConfig`](../interfaces/HttpClientConfig.md) = `{}`

Client configuration options

## Returns

[`HttpClient`](../interfaces/HttpClient.md)

The requested HTTP client implementation
