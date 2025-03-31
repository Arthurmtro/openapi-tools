[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / createApiClient

# Function: createApiClient()

> **createApiClient**\<`T`\>(`endpoints`, `baseUrl`, `options`): `T` & [`ApiClientMethods`](../interfaces/ApiClientMethods.md)

Defined in: [client/src/api/api-client.ts:608](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/api/api-client.ts#L608)

Creates a typed API client instance with direct access to API endpoints

This function creates a proxied API client that allows direct access to
API endpoints as properties of the returned object, as well as access to
the client methods themselves.

## Type Parameters

### T

`T` *extends* [`ApiEndpoints`](../interfaces/ApiEndpoints.md) & `object`

## Parameters

### endpoints

`Record`\<`string`, [`ApiEndpoint`](../interfaces/ApiEndpoint.md) \| [`ApiEndpointConstructor`](../type-aliases/ApiEndpointConstructor.md) \| [`AnyEndpointClass`](../type-aliases/AnyEndpointClass.md)\>

Record of API endpoint constructors or instances

### baseUrl

`string` = `''`

Base URL for API requests

### options

Additional client options

## Returns

`T` & [`ApiClientMethods`](../interfaces/ApiClientMethods.md)

An object that combines API endpoints and client methods

## Example

```typescript
// Import generated API classes
import { PetApi, StoreApi, UserApi } from './generated';

// Create the client with direct access to endpoints
const client = createApiClient(
  {
    pets: PetApi,
    store: StoreApi,
    users: UserApi
  },
  'https://api.example.com',
  {
    httpClientType: 'fetch',
    auth: 'my-api-token',
    headers: {
      'X-App-Version': '1.0.0'
    }
  }
);

// Access API endpoints directly as properties
const pets = await client.pets.findByStatus('available');

// You can also access client methods directly
client.addRequestInterceptor((config) => {
  console.log(`Request to: ${config.url}`);
  return config;
});
```
