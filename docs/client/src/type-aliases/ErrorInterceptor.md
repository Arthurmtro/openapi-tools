[**OpenAPI Tools v0.1.0**](../../../README.md)

***

[OpenAPI Tools](../../../modules.md) / [client/src](../README.md) / ErrorInterceptor

# Type Alias: ErrorInterceptor()

> **ErrorInterceptor** = (`error`) => `unknown` \| `Promise`\<`unknown`\>

Defined in: [client/src/core/types.ts:112](https://github.com/Arthurmtro/openapi-tools/blob/0ec5b52fff16ef5ddecd361e9df5c625e089b42f/packages/client/src/core/types.ts#L112)

Error interceptor function type

A function that intercepts errors from HTTP requests or responses,
allowing you to handle, transform, or log errors before they are
propagated to the caller.

## Parameters

### error

`unknown`

The error to intercept

## Returns

`unknown` \| `Promise`\<`unknown`\>

The handled or transformed error (can be async)

## Example

```typescript
const errorLogger: ErrorInterceptor = (error) => {
  console.error('API error occurred:', error);
  return Promise.reject(error); // Rethrow the error
};

const errorTransformer: ErrorInterceptor = (error) => {
  // Add a user-friendly message based on status code
  if (error.status === 404) {
    error.userMessage = 'The requested resource was not found';
  } else if (error.status === 401) {
    error.userMessage = 'Please log in to access this resource';
  }
  return Promise.reject(error);
};

const tokenRefresher: ErrorInterceptor = async (error) => {
  if (error.status === 401 && !error._isRetry) {
    // Try to refresh the token
    await refreshAuthToken();
    
    // Mark the error to prevent infinite retry loops
    error._isRetry = true;
    
    // Retry the original request
    return apiClient.getHttpClient().request(error.config);
  }
  return Promise.reject(error);
};
```
