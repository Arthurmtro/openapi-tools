# OpenAPI Tools Examples

This directory contains example applications that demonstrate how to use the OpenAPI Tools library.

## Available Examples

### [React Demo App](./react-app/)

A React application that showcases the following features:
- Request debouncing
- Enhanced logging with error classification
- Request cancellation
- Request interceptors

The React demo integrates with the Swagger PetStore API and provides a visual interface to see the debouncing and cancellation in action.

## Running the Examples

Each example directory contains its own README with specific instructions. Generally, you'll need to:

1. Build the main OpenAPI Tools packages first:
   ```bash
   # From the repository root
   pnpm install
   pnpm build
   ```

2. Navigate to the example directory:
   ```bash
   cd examples/react-app
   ```

3. Install dependencies and start the development server:
   ```bash
   pnpm install
   pnpm dev
   ```

## Creating Your Own Examples

If you create your own example using OpenAPI Tools, please consider contributing it back to this repository by submitting a pull request!

## License

All examples are provided under the same license as the main OpenAPI Tools library.