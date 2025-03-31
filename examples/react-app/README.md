# OpenAPI Tools Demo Application

This example app demonstrates the key features of the OpenAPI Tools library, particularly focusing on:

- **Request Debouncing**: Prevent API spam by debouncing rapid requests
- **Enhanced Logging**: Color-coded and timestamped logs with error classification
- **Request Cancellation**: Ability to cancel pending requests
- **Request Interceptors**: Intercepting and modifying requests and responses

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or higher)
- pnpm (v7.0.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/openapi-tools.git
   cd openapi-tools
   ```

2. Install dependencies for the main project:
   ```bash
   pnpm install
   ```

3. Build the packages:
   ```bash
   pnpm build
   ```

4. Navigate to the example app directory:
   ```bash
   cd examples/react-app
   ```

5. Install example app dependencies:
   ```bash
   pnpm install
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

## Important Notes on Package Usage

When using the OpenAPI Tools library in your own projects, there are two main approaches:

### 1. Using the OpenAPI Generator CLI

The recommended way to use the library is through the OpenAPI Generator CLI:

```bash
npx @arthurmtro/openapi-tools-client generate -i your-api-spec.yaml -o ./src/api --with-debounce --with-enhanced-logger
```

This will generate a complete client API with all the necessary types and utilities, properly configured.

### 2. Direct Import of the Library (as shown in this example)

For demonstration purposes, this example directly imports the core functionality:

```typescript
import { createHttpClient } from '@arthurmtro/openapi-tools-common'

// Create HTTP client with debounce enabled
const httpClient = createHttpClient({
  baseURL: 'https://petstore.swagger.io/v2',
  debounce: {
    enabled: true,
    delay: 300,
    cancelPending: true
  }
})
```

Note that in this example we implement a simple custom logger rather than using the EnhancedLogger directly due to ESM/CJS compatibility in the development environment. In a production application generated with the CLI, you'll have access to all features without these workarounds.

## Features Demonstrated

### Request Debouncing

The app demonstrates request debouncing by:
- Tracking how many API calls are attempted vs how many are actually executed
- Allowing rapid typing in the search field to trigger debounced API calls
- Configuring debounce behavior with options for delay and maxWait time

Try typing rapidly in the search field to see the debouncing in action. The "API Calls Attempted" counter will increase with each keystroke, but the "API Calls Executed" counter will only increase when the debounce delay has passed without a new keystroke.

### Request Cancellation

The app allows you to:
- Cancel all pending requests with the "Cancel Pending Requests" button
- See how cancellation integrates with debouncing

### HTTP Client Integration

The demo showcases:
- A simplified API client with interceptors
- Integration with the public Swagger PetStore API
- Error handling and response processing

## Code Explanation

The key components of the demo application:

1. **HTTP Client with Debouncing**:
   ```typescript
   const httpClient = createHttpClient({
     baseURL: 'https://petstore.swagger.io/v2',
     // Enable debouncing with a 300ms delay
     debounce: {
       enabled: true,
       delay: 300, 
       cancelPending: true,
       maxWait: 1000
     }
   })
   ```

2. **Request Interceptor**:
   ```typescript
   httpClient.addRequestInterceptor((config) => {
     logger.info(`Making request to ${config.url}`)
     return config
   })
   ```

3. **Error Interceptor**:
   ```typescript
   httpClient.addErrorInterceptor(logger.createErrorInterceptor())
   ```

4. **Cancellation Support**:
   ```typescript
   const cancelPendingRequests = () => {
     httpClient.cancelAllRequests()
     logger.info('Cancelled all pending requests')
   }
   ```

## Further Learning

For more details on the OpenAPI Tools library, check out:
- The main [README](../../README.md)
- [API Client documentation](../../packages/client/README.md)
- [Common utilities documentation](../../packages/common/README.md)