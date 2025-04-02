# OpenAPI Tools

A modern, lightweight TypeScript toolkit for working with OpenAPI specifications in both client and server environments.

## Features

- 🚀 **Typed Client Generation**: Generate TypeScript clients from OpenAPI specifications
- 🌐 **Flexible HTTP Abstraction**: Choose from multiple HTTP clients (fetch, axios) with a unified interface
- 🔄 **Advanced Request Handling**:
  - 📦 **Caching**: Cache API responses to reduce redundant requests
  - 🔄 **Batching**: Group similar requests to optimize network usage
  - 🛑 **Throttling**: Prevent API rate limit issues with built-in rate limiting
  - 🎯 **Debouncing**: Limit request frequency for search-as-you-type and similar scenarios
  - 🔁 **Automatic Retries**: Recover gracefully from temporary network issues
  - ❌ **Cancellation**: Cancel in-flight requests when they're no longer needed
- 🔒 **Authentication Support**: Built-in support for common auth methods (API keys, OAuth, etc.)
- 🔍 **Interceptors**: Customize request, response and error handling
- 🛠️ **Customizable Naming**: Flexible naming conventions for generated code
- 📦 **Zero Runtime Dependencies**: Minimal dependencies for fetch-based clients
- 📊 **Enhanced Logging**: Comprehensive logging with configurable levels
- ⚡ **Tree-Shaking**: Optimized for minimal bundle size with tree-shaking support

## Installation

```bash
# Install the client package
npm install @arthurmtro/openapi-tools-client

# Or with yarn
yarn add @arthurmtro/openapi-tools-client

# Or with pnpm
pnpm add @arthurmtro/openapi-tools-client
```

## Quick Start

### Generate a Client from OpenAPI Spec

```bash
# Install globally
npm install -g @arthurmtro/openapi-tools-client

# Generate a client
openapi-client generate -i ./path/to/api-spec.yaml -o ./src/api
```

Or use npx:

```bash
npx @arthurmtro/openapi-tools-client generate -i ./path/to/api-spec.yaml -o ./src/api
```

### Using the Generated Client

```typescript
import { createApiClient } from './src/api';

// Create a client instance
const client = createApiClient({
  baseUrl: 'https://api.example.com',
  // Optional configurations
  headers: {
    'Api-Key': 'your-api-key'
  }
});

// Use the client with full type safety
async function fetchUserData(userId: string) {
  try {
    const user = await client.users.getUserById({ userId });
    console.log('User data:', user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

## Advanced Usage

### Configuration with `init`

Create a configuration file for easier client generation:

```bash
# Create a config file
openapi-client init

# Generate client using config
openapi-client generate
```

### Adding Advanced Features

Generate a client with advanced features:

```bash
# With request caching and retries
openapi-client generate -i ./api-spec.yaml -o ./src/api --with-cache --with-retry

# With debouncing for search interfaces
openapi-client generate -i ./api-spec.yaml -o ./src/api --with-debounce
```

### Debounce API Requests

```typescript
import { debounceRequest } from '@arthurmtro/openapi-tools-common';

// Create a debounced search function
const debouncedSearch = debounceRequest(
  (query: string) => client.products.searchProducts({ query }),
  300 // 300ms delay
);

// Use in event handlers
function handleSearchInput(event) {
  const query = event.target.value;
  debouncedSearch(query)
    .then(results => setResults(results))
    .catch(err => console.error(err));
}

// Cleanup on component unmount
import { cancelAllDebouncedRequests } from '@arthurmtro/openapi-tools-common';

useEffect(() => {
  return () => {
    cancelAllDebouncedRequests();
  };
}, []);
```

## CLI Options

The `openapi-client` CLI provides various options to customize the generated client. See [CLI documentation](./docs/client/CLI_OPTIONS.md) for full details.

### Common Options

- `-i, --input <path>`: Path to OpenAPI specification file
- `-o, --output <directory>`: Output directory
- `--http-client <type>`: HTTP client to use (fetch/axios). Default: fetch
- `--naming <convention>`: Naming convention (camelCase/kebab-case/PascalCase). Default: camelCase
- `--with-cache`: Enable HTTP response caching
- `--with-retry`: Enable automatic request retry
- `--with-debounce`: Enable request debouncing
- `--with-cancellation`: Enable request cancellation

## Packages

- [@arthurmtro/openapi-tools-client](./packages/client) - Client-side OpenAPI tools for consuming REST APIs
- [@arthurmtro/openapi-tools-common](./packages/common) - Shared utilities and HTTP client abstractions
- [@arthurmtro/openapi-tools-server](./packages/server) - Server-side OpenAPI tools (coming soon)

## Development

This project uses pnpm workspaces for managing packages.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format

# Run type checking
pnpm typecheck
```

## License

MIT