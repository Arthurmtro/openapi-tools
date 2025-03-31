# @openapi-tools/client

A lightweight, typed API client generator for OpenAPI specifications.

## Features

- 🚀 Generate TypeScript clients from OpenAPI specifications
- 🔒 Built-in authentication support
- 🔄 Request and response interceptors
- 🛠️ Customizable naming conventions
- 📦 Minimal dependencies

## Installation

```bash
npm install @openapi-tools/client
```

## Usage

### Generating a client

```typescript
import { generateClient } from "@openapi-tools/client";

await generateClient({
  specPath: "./petstore.yaml",
  outputDir: "./generated",
  options: {
    namingConvention: "camelCase",
    // Choose your HTTP client implementation
    // 'fetch' (default) - Uses native fetch API with zero dependencies
    // 'axios' - Uses axios (requires axios to be installed)
    httpClient: "fetch",
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

### Adding interceptors

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

## License

MIT
