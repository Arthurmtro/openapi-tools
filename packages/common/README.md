# @arthurmtro/openapi-tools-common

Shared utilities and types for OpenAPI tools with optimized tree-shaking support.

## Features

- 🧩 Shared types and interfaces for OpenAPI tools
- 🌐 HTTP client abstraction layer
- 🔄 Support for multiple HTTP client implementations
- 🧰 Common utilities for formatting and error handling
- 📦 Optimized bundle size with tree-shakable imports
- 🔄 Advanced request utilities (caching, batching, throttling, retry)
- 📊 Logging system with configurable levels

## Installation

```bash
npm install @arthurmtro/openapi-tools-common
```

## Usage

### Using the HTTP client abstraction

This package provides a flexible HTTP client abstraction that can be implemented with different libraries:

```typescript
import { 
  createDefaultHttpClient, 
  createAxiosHttpClient,
  type HttpClient 
} from '@arthurmtro/openapi-tools-common';

// Create a fetch-based HTTP client (default)
const fetchClient = createDefaultHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create an Axios-based HTTP client (requires axios)
const axiosClient = createAxiosHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Use the client
const response = await fetchClient.get('/users');
console.log(response.data);
```

### Optimized Imports (Tree-Shakable)

For better bundle size, you can import only what you need:

```typescript
// Import only HTTP client
import { createHttpClient } from '@arthurmtro/openapi-tools-common/http';

// Import only caching utilities
import { RequestCache } from '@arthurmtro/openapi-tools-common/http/utils/cache';

// Import only request throttling
import { RequestThrottler } from '@arthurmtro/openapi-tools-common/http/utils/throttle';

// Import only request batching
import { RequestBatcher } from '@arthurmtro/openapi-tools-common/http/utils/batch';

// Import only retry utilities
import { RequestRetry } from '@arthurmtro/openapi-tools-common/http/utils/retry';

// Import only logger
import { Logger } from '@arthurmtro/openapi-tools-common/utils';
```

### Creating a custom HTTP client

You can implement your own HTTP client by implementing the `HttpClient` interface:

```typescript
import { type HttpClient, type RequestOptions, type HttpResponse } from '@arthurmtro/openapi-tools-common/http';

// Implement a custom HTTP client
class CustomHttpClient implements HttpClient {
  // Implement all required methods...
  
  async request<T>(config: RequestOptions): Promise<HttpResponse<T>> {
    // Custom implementation...
  }
  
  async get<T>(url: string, config?: Omit<RequestOptions, 'url' | 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>({ 
      url, 
      method: 'GET',
      ...config
    });
  }
  
  // Other methods...
}
```

### Using advanced HTTP utilities

```typescript
// Response caching
import { RequestCache } from '@arthurmtro/openapi-tools-common/http/utils/cache';

const cache = new RequestCache();
cache.set(requestOptions, responseData);
const cachedResponse = cache.get(requestOptions);

// Request throttling
import { RequestThrottler } from '@arthurmtro/openapi-tools-common/http/utils/throttle';

const throttler = new RequestThrottler({ limit: 10, interval: 1000 });
const result = await throttler.throttle(() => fetchData());

// Request batching
import { RequestBatcher } from '@arthurmtro/openapi-tools-common/http/utils/batch';

const batcher = new RequestBatcher();
const response = await batcher.add(requestOptions, processBatchedRequests);

// Request retry
import { RequestRetry } from '@arthurmtro/openapi-tools-common/http/utils/retry';

const retry = new RequestRetry({ maxRetries: 3 });
if (retry.shouldRetry(error, retryCount)) {
  // Retry the request
}
```

### Formatting utilities

```typescript
import { formatName } from '@arthurmtro/openapi-tools-common/utils';

// Format names to camelCase
const camelCase = formatName('user-profile'); // "userProfile"
const camelCase2 = formatName('UserProfile'); // "userProfile"
const camelCase3 = formatName('user_profile'); // "userProfile"
```

## Available Submodules

- `@arthurmtro/openapi-tools-common/http` - HTTP client and core types
- `@arthurmtro/openapi-tools-common/utils` - General utilities and logger
- `@arthurmtro/openapi-tools-common/http/utils` - All HTTP utilities
- `@arthurmtro/openapi-tools-common/http/utils/cache` - HTTP response caching
- `@arthurmtro/openapi-tools-common/http/utils/batch` - Request batching
- `@arthurmtro/openapi-tools-common/http/utils/throttle` - Request throttling/rate limiting
- `@arthurmtro/openapi-tools-common/http/utils/retry` - Automatic request retry

## API Reference

### HTTP Client

- `HttpClient`: Interface for HTTP clients
- `createDefaultHttpClient(config)`: Creates a fetch-based HTTP client
- `createAxiosHttpClient(config)`: Creates an Axios-based HTTP client
- `RequestOptions`: Options for HTTP requests
- `HttpResponse<T>`: Response from HTTP requests

### HTTP Utilities

- `RequestCache`: Caching mechanism for HTTP responses
- `RequestBatcher`: Batching mechanism for similar requests
- `RequestThrottler`: Rate limiting for API requests
- `RequestRetry`: Automatic retry for failed requests

### Formatting

- `formatName(name)`: Formats a name to camelCase

### Error Handling

- `createError(message, status?, code?, details?)`: Creates a standardized error object

### Logging

- `Logger`: Centralized logging utility with configurable levels

## Bundle Size Optimization

Using targeted imports allows your bundler to tree-shake unused code, resulting in smaller bundle sizes in your application.

## License

MIT