[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / AnyEndpointClass

# Type Alias: AnyEndpointClass()

> **AnyEndpointClass** = (...`args`) => `object`

Defined in: [client/src/core/types.ts:298](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L298)

Helper type for both endpoint instances and their constructors

This is a more permissive type used for tests or custom endpoints.
It allows for any constructor args and any methods on the resulting instance.

## Parameters

### args

...`any`[]

## Returns

`object`
