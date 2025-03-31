# CLI Options

The `openapi-client` CLI provides various options to customize the generated client.

## Generate Command

The `generate` command is used to generate a typed client from an OpenAPI specification.

```bash
openapi-client generate -i <input> -o <output> [options]
```

### Required Options

- `-i, --input <path>`: Path to OpenAPI specification file
- `-o, --output <directory>`: Output directory

### Optional Options

- `-f, --format <format>`: Format of the OpenAPI specification (json/yaml)
- `--naming <convention>`: Naming convention (camelCase/kebab-case/PascalCase). Default: camelCase
- `--http-client <type>`: HTTP client to use (fetch/axios). Default: fetch
- `--log-level <level>`: Log level (silent/error/warn/info/debug). Default: info

### Advanced Options

- `--with-cache`: Generate client with HTTP response caching enabled. Default: false
- `--with-retry`: Generate client with automatic request retry for failures. Default: false
- `--with-throttling`: Generate client with request throttling/rate limiting. Default: false
- `--with-batching`: Generate client with request batching for similar requests. Default: false
- `--with-enhanced-logger`: Generate client with enhanced logger for better error handling. Default: false
- `--with-cancellation`: Generate client with request cancellation support. Default: false
- `--with-debounce`: Generate client with request debouncing support. Default: false

## Init Command

The `init` command creates a configuration file for the client generator.

```bash
openapi-client init [options]
```

### Options

- `-f, --file <path>`: Path to configuration file. Default: ./openapitools.json

## Feature Descriptions

### HTTP Response Caching

When enabled with `--with-cache`, the generated client includes a caching system for HTTP responses. This can significantly improve performance by avoiding redundant network requests for frequently accessed and infrequently changed data.

### Automatic Request Retry

When enabled with `--with-retry`, the generated client will automatically retry failed requests due to network issues or server errors. This improves resilience and can help handle temporary connectivity problems.

### Request Throttling

When enabled with `--with-throttling`, the generated client includes rate limiting capabilities to prevent overloading the API server with too many requests in a short period of time.

### Request Batching

When enabled with `--with-batching`, the generated client can combine similar requests into batches, reducing the number of network requests and improving performance.

### Enhanced Logger

When enabled with `--with-enhanced-logger`, the generated client includes a more sophisticated logging system with better error formatting, color-coded output, and error type classification for easier debugging.

### Request Cancellation

When enabled with `--with-cancellation`, the generated client supports cancelling in-flight HTTP requests. This is particularly useful for search-as-you-type interfaces or when a user navigates away from a page with pending requests.

The client exposes methods like:
- `createCancellationToken()`: Creates a token that can be used to cancel requests
- `cancelAllRequests()`: Cancels all in-flight requests

### Request Debouncing

When enabled with `--with-debounce`, the generated client includes debouncing utilities for API requests. This is useful for limiting the number of requests made in rapid succession, such as during search-as-you-type interactions.

The client exposes methods like:
- `debounce()`: Creates a debounced version of a request function
- `cancelAllDebouncedRequests()`: Cancels all pending debounced requests

## Example Usage

```bash
# Generate a client with fetch, cancellation and debouncing
openapi-client generate -i ./specs/api.yaml -o ./src/api --http-client fetch --with-cancellation --with-debounce

# Generate a client with axios and enhanced error handling
openapi-client generate -i ./specs/api.yaml -o ./src/api --http-client axios --with-enhanced-logger --with-retry

# Create a configuration file
openapi-client init -f ./openapitools.json
```