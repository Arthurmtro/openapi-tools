# OpenAPI Tools

A collection of tools for working with OpenAPI specifications in both client and server environments.

## Features

- 🚀 Generate TypeScript clients from OpenAPI specifications
- 🌐 HTTP client abstraction with multiple implementations (fetch, axios)
- 🔒 Built-in authentication support
- 🔄 Request and response interceptors
- 🛠️ Customizable naming conventions
- 📦 Minimal dependencies - zero required runtime dependencies for client libraries

## Packages

- [@openapi-tools/client](./packages/client) - Client-side OpenAPI tools for consuming REST APIs
- [@openapi-tools/server](./packages/server) - Server-side OpenAPI tools with WebSocket support
- [@arthurmtro/openapi-tools-common](./packages/common) - Shared utilities and HTTP client abstractions

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
```
