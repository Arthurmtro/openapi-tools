# OpenAPI Tools - AI Assistant Guide

This document provides a structured overview of the OpenAPI Tools project specifically designed for AI assistants. It contains key information about the project structure, features, and usage patterns to help AI assistants understand and work with the codebase.

## Project Overview

OpenAPI Tools is a TypeScript toolkit for generating strongly-typed API clients from OpenAPI specifications. The project follows a monorepo structure using pnpm workspaces with these main packages:

1. `@arthurmtro/openapi-tools-client`: Client-side tools for generating TypeScript API clients
2. `@arthurmtro/openapi-tools-common`: Shared utilities and HTTP client abstractions
3. `@arthurmtro/openapi-tools-server`: Server-side OpenAPI tools (planned)

## Key Concepts

### Client Generation

The core functionality revolves around generating TypeScript API clients from OpenAPI specifications:

```
openapi-client generate -i ./path/to/spec.yaml -o ./src/api
```

This produces a fully-typed client that accurately reflects the API structure defined in the OpenAPI spec.

### HTTP Client Abstraction

The project provides a unified interface for different HTTP clients:
- Native fetch (default, zero dependencies)
- Axios (optional)

### Advanced Request Features

The project implements several patterns for optimizing API requests:

1. **Caching**: Stores responses to reduce redundant network requests
2. **Batching**: Combines similar requests to reduce network overhead
3. **Throttling**: Controls request rates to avoid API rate limiting
4. **Debouncing**: Limits request frequency (e.g., for search-as-you-type)
5. **Retry**: Automatically retries failed requests with configurable backoff
6. **Cancellation**: Supports cancelling in-flight requests

### Class Structure

Key classes include:
- `ApiClient`: Main class for interacting with the API
- `DebounceManager`: Manages debounced requests
- `HttpClient`: Abstract base class for HTTP implementations
- Various adapter implementations (FetchAdapter, AxiosAdapter)

## Directory Structure

```
/packages
  /client         # API client generator
    /src
      /api        # API client implementation
      /generator  # Code generation logic
      /templates  # Code templates for generation
  /common         # Shared utilities
    /src
      /http       # HTTP client abstraction
        /adapters # HTTP client adapters (fetch, axios)
        /utils    # Request utilities (cache, batch, etc.)
      /utils      # General utilities
```

## Code Examples

### Creating a Client

```typescript
// Import the generated client
import { createApiClient } from './src/api';

// Create a configured instance
const client = createApiClient({
  baseUrl: 'https://api.example.com',
  headers: { 'Api-Key': 'your-api-key' }
});

// Use with full type safety
const user = await client.users.getUserById({ userId: '123' });
```

### Debouncing Requests

```typescript
import { debounceRequest } from '@arthurmtro/openapi-tools-common';

// Create a debounced search function
const debouncedSearch = debounceRequest(
  (query: string) => client.products.searchProducts({ query }),
  300 // 300ms delay
);

// Use in any event handler
function handleSearchInput(query) {
  debouncedSearch(query)
    .then(results => {
      // Process search results
      console.log('Search results:', results);
    })
    .catch(err => console.error(err));
}

// Cleanup when done (e.g., application cleanup or module unload)
import { cancelAllDebouncedRequests } from '@arthurmtro/openapi-tools-common';
cancelAllDebouncedRequests();
```

## Command Line Interface

The project provides a CLI for generating clients:

```bash
# Basic usage
openapi-client generate -i <input-spec> -o <output-dir>

# With features enabled
openapi-client generate -i <input-spec> -o <output-dir> --with-cache --with-retry

# Create config file
openapi-client init
```

## Development Workflow

The project uses these commands:
- `pnpm install`: Install dependencies
- `pnpm build`: Build all packages
- `pnpm test`: Run tests
- `pnpm lint`: Lint code with Biome
- `pnpm format`: Format code with Biome
- `pnpm typecheck`: Run TypeScript type checking

## Type System Notes

The project uses TypeScript throughout and leverages:
- Generics for type-safe HTTP client operations
- Mapped types for generating typed API interfaces
- Type inference from OpenAPI schemas
- Conditional types for advanced type manipulation

This AI-focused documentation should help AI assistants understand the structure and functionality of the OpenAPI Tools project for more effective assistance.