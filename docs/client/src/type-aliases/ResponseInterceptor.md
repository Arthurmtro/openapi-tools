[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ResponseInterceptor

# Type Alias: ResponseInterceptor()

> **ResponseInterceptor** = (`response`) => `HttpResponse` \| `Promise`\<`HttpResponse`\>

Defined in: [client/src/core/types.ts:66](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L66)

Response interceptor function type

A function that intercepts HTTP responses before they are returned to the caller,
allowing you to modify, log, or handle the response in some way.

## Parameters

### response

`HttpResponse`

The HTTP response to intercept

## Returns

`HttpResponse` \| `Promise`\<`HttpResponse`\>

The modified HTTP response (can be async)

## Example

```typescript
const responseLogger: ResponseInterceptor = (response) => {
  console.log(`Received response from ${response.config.url} with status ${response.status}`);
  return response;
};

const dataTransformer: ResponseInterceptor = (response) => {
  // Transform data if it's a list response
  if (Array.isArray(response.data)) {
    response.data = response.data.map(item => ({
      ...item,
      transformedAt: new Date().toISOString()
    }));
  }
  return response;
};
```
