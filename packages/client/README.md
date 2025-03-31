# @arthurmtro/openapi-tools-client

A lightweight, typed API client generator for OpenAPI specifications with optimized tree-shaking support.

## Features

- 🚀 Generate TypeScript clients from OpenAPI specifications
- 🌐 Multiple HTTP clients - fetch (zero dependencies) or axios
- 🔄 Advanced HTTP features:
  - Response caching for improved performance
  - Request batching to reduce API load
  - Automatic retries for failed requests
  - Rate limiting to prevent quota issues
- 🔒 Built-in authentication support
- 🔄 Request, response and error interceptors
- 🛠️ Customizable naming conventions
- 📦 Optimized bundle size with tree-shakable imports
- 📊 Configurable logging levels

## Installation

```bash
npm install @arthurmtro/openapi-tools-client
```

## Usage

### Generating a client

```typescript
import { generateClient } from "@arthurmtro/openapi-tools-client";

await generateClient({
  specPath: "./petstore.yaml",
  outputDir: "./generated",
  options: {
    namingConvention: "camelCase",
    // Choose your HTTP client implementation
    // 'fetch' (default) - Uses native fetch API with zero dependencies
    // 'axios' - Uses axios (requires axios to be installed)
    httpClient: "fetch",
    // Advanced HTTP client options
    httpClientOptions: {
      cache: {
        enabled: true,
        ttl: 60000, // 1 minute
        maxEntries: 100
      },
      retry: {
        enabled: true,
        maxRetries: 3,
        statusCodes: [408, 429, 500, 502, 503, 504]
      },
      throttle: {
        enabled: true,
        limit: 60,
        interval: 60000, // 1 minute
        strategy: 'queue'
      }
    },
    // Enable request batching
    enableBatching: true
  },
});
```

### Using the generated client

```typescript
import { createApiClient, API_CLIENTS } from "./generated";

// Create a client instance
const client = createApiClient(API_CLIENTS, "https://api.example.com");

// Use the client
const pets = await client.pet.findPetsByStatus({ status: "available" });
```

### Optimized Imports (Tree-Shakable)

For better bundle size, you can import only what you need:

```typescript
// Import only the API client
import { createApiClient } from '@arthurmtro/openapi-tools-client/api';

// Import only the generator
import { generateClient } from '@arthurmtro/openapi-tools-client/generator';

// Import only core types
import { type ApiClientOptions } from '@arthurmtro/openapi-tools-client/core';

// Import only utility functions
import { detectHttpClientImplementation } from '@arthurmtro/openapi-tools-client/utils';
```

### HTTP Client Options

```typescript
// Default (uses fetch)
const client = createApiClient(API_CLIENTS, "https://api.example.com");

// Explicitly choose fetch (no additional dependencies)
const fetchClient = createApiClient(API_CLIENTS, "https://api.example.com", {
  httpClientType: "fetch",
});

// Use axios (requires axios to be installed)
const axiosClient = createApiClient(API_CLIENTS, "https://api.example.com", {
  httpClientType: "axios",
});

// Provide a custom HTTP client implementation
import { createCustomHttpClient } from "./myHttpClient";
const customClient = createApiClient(API_CLIENTS, "https://api.example.com", {
  httpClient: createCustomHttpClient(),
});
```

### Adding interceptors and advanced features

```typescript
// Add a request interceptor
client.addRequestInterceptor((config) => {
  console.log("Request:", config.url);
  return config;
});

// Add a response interceptor
client.addResponseInterceptor((response) => {
  console.log("Response:", response.status);
  return response;
});

// Add an error interceptor
client.addErrorInterceptor((error) => {
  console.error("API Error:", error);
  return Promise.reject(error);
});

// Configure response caching
client.configureCaching(true, { 
  ttl: 120000,  // 2 minutes cache
  maxEntries: 100
});

// Configure automatic retry for failed requests
client.configureRetry(true, {
  maxRetries: 3,
  statusCodes: [408, 429, 500, 502, 503, 504]
});

// Configure rate limiting
client.configureThrottling(true, {
  limit: 60,       // 60 requests 
  interval: 60000  // per minute
});

// Configure request batching
client.configureBatching(true, {
  maxBatchSize: 10,
  debounceTime: 50
});

// Set logging level
client.setLogLevel('debug'); // Options: 'silent', 'error', 'warn', 'info', 'debug'
```

### Authentication

```typescript
// Using a static token
const client = createApiClient(API_CLIENTS, "https://api.example.com", {
  auth: "your-auth-token",
});

// Using a token provider function
const client = createApiClient(API_CLIENTS, "https://api.example.com", {
  auth: async () => {
    // Get token from somewhere
    return "dynamic-auth-token";
  },
});
```

### Creating a custom HTTP client

If you need a different HTTP client implementation, you can implement the `HttpClient` interface:

```typescript
import {
  type HttpClient,
  type RequestOptions,
  type HttpResponse,
} from "@arthurmtro/openapi-tools-common";

// Example using a different HTTP library
class MyCustomHttpClient implements HttpClient {
  // Implement all required methods of the HttpClient interface
  request<T>(config: RequestOptions): Promise<HttpResponse<T>> {
    // Your implementation
  }

  get<T>(
    url: string,
    config?: Omit<RequestOptions, "url" | "method">
  ): Promise<HttpResponse<T>> {
    // Your implementation
  }

  // ... implement other methods
}

// Use your custom client
const client = createApiClient(API_CLIENTS, "https://api.example.com", {
  httpClient: new MyCustomHttpClient(),
});
```

## CLI Usage

This package provides a command-line interface for generating API clients:

```bash
# Generate a client with default options
npx openapi-client generate -i ./openapi.yaml -o ./src/api

# Generate a client with advanced options
npx openapi-client generate -i ./openapi.yaml -o ./src/api \
  --naming camelCase \
  --http-client fetch \
  --with-cache \
  --with-retry \
  --with-throttling \
  --with-batching \
  --log-level info
  
# Create a configuration file
npx openapi-client init
```

## API Reference

### `generateClient(options)`

Generates a TypeScript client from an OpenAPI specification.

#### Options

- `specPath`: Path to the OpenAPI specification file
- `outputDir`: Directory where the generated client code will be written
- `format`: Format of the OpenAPI specification file (default: detected from file extension)
- `options`: Additional generator options
  - `namingConvention`: Naming convention for API endpoints (default: 'camelCase')
  - `httpClient`: HTTP client library to use (default: 'fetch')
    - 'fetch': Uses native fetch API with no additional dependencies
    - 'axios': Uses axios HTTP client (requires axios to be installed)
  - `httpClientOptions`: Advanced HTTP client options
    - `cache`: Configure response caching
    - `retry`: Configure automatic retries
    - `throttle`: Configure rate limiting
  - `enableBatching`: Enable request batching

### `createApiClient(endpoints, baseUrl, options)`

Creates a typed API client instance with direct access to API endpoints.

#### Parameters

- `endpoints`: Record of API endpoint constructors or instances
- `baseUrl`: Base URL for API requests
- `options`: Additional client options
  - `timeout`: Request timeout in milliseconds
  - `headers`: Default headers for all requests
  - `withCredentials`: Whether to include credentials in cross-site requests
  - `auth`: Authentication token or function that returns a token
  - `requestInterceptors`: Array of request interceptors
  - `responseInterceptors`: Array of response interceptors
  - `errorInterceptors`: Array of error interceptors
  - `httpClient`: Custom HTTP client implementation (must implement HttpClient interface)
  - `httpClientType`: Type of HTTP client to create if httpClient is not provided ('fetch' or 'axios', default: 'fetch')
  - Cache, retry, throttling and batching options (see `httpClientOptions` in `generateClient`)

#### Client Methods

The created client instance provides the following methods:

- `configure(options)`: Reconfigure the client with new options
- `getBaseUrl()`: Get the base URL used for API requests
- `getHttpClient()`: Get the HTTP client instance
- `addRequestInterceptor(interceptor)`: Add a request interceptor
- `addResponseInterceptor(interceptor)`: Add a response interceptor
- `addErrorInterceptor(interceptor)`: Add an error interceptor
- `configureCaching(enabled, options)`: Configure response caching
- `clearCache(urlPattern)`: Clear the response cache
- `configureThrottling(enabled, options)`: Configure rate limiting
- `configureRetry(enabled, options)`: Configure automatic retry
- `configureBatching(enabled, options)`: Configure request batching
- `setLogLevel(level)`: Set the log level

## License

MIT
