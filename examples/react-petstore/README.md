# React Petstore Example

This is an example React application that demonstrates how to use the OpenAPI Tools client library to interact with the Swagger Petstore API.

## Features

- Generates a TypeScript client from the Petstore OpenAPI specification
- Uses React hooks to manage API requests
- Displays pets by status (available, pending, sold)
- Shows loading and error states

## Setup

### Prerequisites

- Node.js (v16+)
- pnpm

### Installation

```bash
# Install dependencies
pnpm install
```

### Generate the API Client

Before running the app, you need to generate the API client from the OpenAPI specification:

```bash
pnpm run generate-client
```

This will create a fully typed API client in `src/api/generated/` based on the Petstore OpenAPI spec.

### Running the App

```bash
pnpm run dev
```

This will start the development server and open the app in your browser.

## Project Structure

- `/openapi` - Contains the OpenAPI specification file
- `/scripts` - Contains the script to generate the API client
- `/src`
  - `/api` - API client and configuration
  - `/components` - Reusable React components
  - `/hooks` - Custom React hooks
  - `/pages` - Page components

## How It Works

1. The OpenAPI specification is used to generate a TypeScript client
2. The client is configured with interceptors for logging and error handling
3. Custom React hooks are used to manage API requests and state
4. Components display the data and handle loading/error states

This example demonstrates how to integrate the OpenAPI Tools client with React to create a type-safe API client with minimal dependencies.