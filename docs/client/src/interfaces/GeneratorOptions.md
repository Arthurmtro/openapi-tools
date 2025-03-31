[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / GeneratorOptions

# Interface: GeneratorOptions

Defined in: [client/src/core/types.ts:398](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L398)

Options for the OpenAPI client generator

This interface defines the configuration options for generating
API clients from OpenAPI specifications.

## Example

```typescript
// Generate a client with custom options
await generateClient({
  specPath: './swagger/petstore.yaml',
  outputDir: './src/api',
  format: 'yaml',
  options: {
    namingConvention: 'camelCase',
    httpClient: 'fetch'
  }
});
```

## Properties

### format?

> `optional` **format**: `"json"` \| `"yaml"`

Defined in: [client/src/core/types.ts:435](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L435)

Format of the OpenAPI specification file

By default, the format is detected from the file extension. You can
override this by specifying the format explicitly.

#### Default

```ts
Detected from file extension
```

***

### options?

> `optional` **options**: `object`

Defined in: [client/src/core/types.ts:442](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L442)

Additional generator options

These options control various aspects of the code generation process.

#### httpClient?

> `optional` **httpClient**: `"fetch"` \| `"axios"`

HTTP client library to use in the generated client

- 'axios': Use axios (requires axios as a dependency)
- 'fetch': Use native fetch (zero dependencies)

##### Default

```ts
'fetch'
```

#### namingConvention?

> `optional` **namingConvention**: `"camelCase"` \| `"kebab-case"` \| `"PascalCase"`

Naming convention for API endpoints

Controls how API endpoint names are formatted in the generated client.

- 'camelCase': Use camelCase (e.g., petApi)
- 'kebab-case': Use kebab-case (e.g., pet-api)
- 'PascalCase': Use PascalCase (e.g., PetApi)

##### Default

```ts
'camelCase'
```

***

### outputDir

> **outputDir**: `string`

Defined in: [client/src/core/types.ts:425](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L425)

Directory where the generated client code will be written

This directory will be created if it doesn't exist. The generator
will create subdirectories within this directory for models and APIs.

#### Example

```
outputDir: './src/api'
outputDir: './generated'
```

***

### specPath

> **specPath**: `string`

Defined in: [client/src/core/types.ts:411](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L411)

Path to the OpenAPI specification file

This can be a JSON or YAML file that contains the OpenAPI specification.
Both local file paths and HTTP URLs are supported.

#### Example

```
specPath: './specs/petstore.yaml'
specPath: '/absolute/path/to/api.json'
```
