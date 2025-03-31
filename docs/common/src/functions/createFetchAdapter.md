[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [common/src](../README.md) / createFetchAdapter

# Function: createFetchAdapter()

> **createFetchAdapter**(`config`): [`HttpClient`](../interfaces/HttpClient.md)

Defined in: [common/src/http/adapters/fetch-adapter.ts:11](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/common/src/http/adapters/fetch-adapter.ts#L11)

Creates a fetch-based HTTP client
Uses native fetch API with no additional dependencies

## Parameters

### config

[`HttpClientConfig`](../interfaces/HttpClientConfig.md) = `{}`

Client configuration options

## Returns

[`HttpClient`](../interfaces/HttpClient.md)

HttpClient implementation using fetch
