[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / RequestInterceptor

# Type Alias: RequestInterceptor()

> **RequestInterceptor** = (`config`) => `RequestOptions` \| `Promise`\<`RequestOptions`\>

Defined in: [client/src/core/types.ts:32](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L32)

Request interceptor function type

A function that intercepts HTTP requests before they are sent, allowing
you to modify, log, or handle the request in some way.

## Parameters

### config

`RequestOptions`

The request configuration to intercept

## Returns

`RequestOptions` \| `Promise`\<`RequestOptions`\>

The modified request configuration (can be async)

## Example

```typescript
const addApiKeyInterceptor: RequestInterceptor = (config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-API-Key': 'your-api-key'
    }
  };
};
```
