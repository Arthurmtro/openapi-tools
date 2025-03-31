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

## Features Demonstrated

### Request Debouncing

The app demonstrates request debouncing by:
- Tracking how many API calls are attempted vs how many are actually executed
- Allowing rapid typing in the search field to trigger debounced API calls
- Configuring debounce behavior with options for delay and maxWait time

Try typing rapidly in the search field to see the debouncing in action. The "API Calls Attempted" counter will increase with each keystroke, but the "API Calls Executed" counter will only increase when the debounce delay has passed without a new keystroke.

### Enhanced Logging

The enhanced logger features:
- Color-coded log levels (debug, info, warn, error)
- Timestamp prefixes for each log entry
- Error classification (NETWORK, TIMEOUT, AUTH, SERVER, etc.)
- Detailed error formatting with status codes and error details

All logs are displayed in the console panel in the app interface.

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

1. **EnhancedLogger Configuration**: 
   ```typescript
   const logger = new EnhancedLogger({
     level: 'debug',
     prefix: '[PetStore]',
     colorize: true,
     timestamp: true
   })
   ```

2. **HTTP Client with Debouncing**:
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

3. **Request Interceptor**:
   ```typescript
   httpClient.addRequestInterceptor((config) => {
     logger.info(`Making request to ${config.url}`)
     return config
   })
   ```

4. **Error Interceptor**:
   ```typescript
   httpClient.addErrorInterceptor(logger.createErrorInterceptor())
   ```

5. **Cancellation Support**:
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