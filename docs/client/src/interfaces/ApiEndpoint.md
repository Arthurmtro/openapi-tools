[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ApiEndpoint

# Interface: ApiEndpoint

Defined in: [client/src/core/types.ts:253](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L253)

Generic API endpoint interface

Represents the common structure of an API endpoint, which is a collection
of methods that make API requests. This is a minimal interface that allows
for any method names and arguments.

## Indexable

\[`methodName`: `string`\]: (...`args`) => `Promise`\<`unknown`\>
