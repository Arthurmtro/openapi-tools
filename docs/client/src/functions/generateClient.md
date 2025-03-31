[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / generateClient

# Function: generateClient()

> **generateClient**(`options`): `Promise`\<`void`\>

Defined in: [client/src/generator/generator.ts:324](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/generator/generator.ts#L324)

Generates a TypeScript client from an OpenAPI specification

This function generates a fully typed TypeScript client for interacting with
an API defined by an OpenAPI specification. The generated client includes:

- Typed API endpoints for all operations defined in the spec
- Models for all schemas defined in the spec
- A client wrapper with interceptor support

## Parameters

### options

[`GeneratorOptions`](../interfaces/GeneratorOptions.md)

Configuration options for the generator

## Returns

`Promise`\<`void`\>

A promise that resolves when generation is complete

## Example

```typescript
// Generate a client for the Petstore API
await generateClient({
  specPath: './petstore.yaml',
  outputDir: './src/api',
  options: {
    namingConvention: 'camelCase',
    httpClient: 'fetch' // Use fetch for minimal dependencies
  }
});

// Generated client can be imported and used like:
// import { createApiClient, API_CLIENTS } from './src/api';
// const client = createApiClient(API_CLIENTS, 'https://petstore.example.com');
// const pets = await client.pet.findByStatus('available');
```
