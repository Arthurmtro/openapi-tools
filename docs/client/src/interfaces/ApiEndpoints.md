[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ApiEndpoints

# Interface: ApiEndpoints

Defined in: [client/src/core/types.ts:318](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L318)

Map of API endpoints

This interface represents a collection of API endpoints, where the keys
are the endpoint names and the values are the endpoint instances.

## Example

```typescript
// Example of an ApiEndpoints object
const endpoints: ApiEndpoints = {
  pets: new PetApi(config, baseUrl, httpClient),
  users: new UserApi(config, baseUrl, httpClient),
  stores: new StoreApi(config, baseUrl, httpClient)
};
```

## Indexable

\[`key`: `string`\]: [`ApiEndpoint`](ApiEndpoint.md)
