# @arthurmtro/openapi-tools-common

Shared utilities and types for OpenAPI tools.

## Features

- 🧩 Shared types and interfaces for OpenAPI tools
- 🌐 HTTP client abstraction layer
- 🔄 Support for multiple HTTP client implementations
- 🧰 Common utilities for formatting and error handling

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

### Creating a custom HTTP client

You can implement your own HTTP client by implementing the `HttpClient` interface:

```typescript
import { type HttpClient, type RequestOptions, type HttpResponse } from '@arthurmtro/openapi-tools-common';

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

### Formatting utilities

```typescript
import { formatName } from '@arthurmtro/openapi-tools-common';

// Format names according to conventions
const camelCase = formatName('user-profile', 'camelCase'); // "userProfile"
const kebabCase = formatName('UserProfile', 'kebab-case'); // "user-profile"
const pascalCase = formatName('user_profile', 'PascalCase'); // "UserProfile"
```

## API Reference

### HTTP Client

- `HttpClient`: Interface for HTTP clients
- `createDefaultHttpClient(config)`: Creates a fetch-based HTTP client
- `createAxiosHttpClient(config)`: Creates an Axios-based HTTP client
- `RequestOptions`: Options for HTTP requests
- `HttpResponse<T>`: Response from HTTP requests

### Formatting

- `formatName(name, convention)`: Formats a name according to a naming convention
- `toKebabCase(str)`: Converts a string to kebab-case

### Error Handling

- `createError(message, status?, code?, details?)`: Creates a standardized error object

## License

MIT