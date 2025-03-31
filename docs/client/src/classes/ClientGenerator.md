[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ClientGenerator

# Class: ClientGenerator

Defined in: [client/src/generator/generator.ts:49](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/generator/generator.ts#L49)

Class that handles TypeScript client code generation from OpenAPI specifications

This class encapsulates the logic for:
- Parsing OpenAPI specifications (JSON or YAML)
- Running the OpenAPI Generator CLI to generate base TypeScript code
- Identifying API endpoints from the generated code
- Generating client wrapper code with support for interceptors and authentication

The class is designed to be extensible and configurable, with options for
naming conventions, HTTP client libraries, and more.

## Constructors

### Constructor

> **new ClientGenerator**(`options`): `ClientGenerator`

Defined in: [client/src/generator/generator.ts:52](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/generator/generator.ts#L52)

#### Parameters

##### options

[`GeneratorOptions`](../interfaces/GeneratorOptions.md)

#### Returns

`ClientGenerator`

## Methods

### generate()

> **generate**(): `Promise`\<`void`\>

Defined in: [client/src/generator/generator.ts:256](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/generator/generator.ts#L256)

Main method that orchestrates the entire generation process

#### Returns

`Promise`\<`void`\>
