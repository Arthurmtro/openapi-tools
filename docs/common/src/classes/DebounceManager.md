# DebounceManager

Manages debounced requests by endpoint key.

## Description

The DebounceManager class provides a way to debounce API requests, ensuring that rapidly fired requests to the same endpoint are grouped into a single request after a specified delay period has passed. This can significantly reduce the number of API calls and improve performance in situations like search-as-you-type interfaces.

## Constructor

```typescript
constructor(options?: DebounceOptions)
```

### Parameters

- **options**: Optional configuration options for the manager
  - **enabled**: Whether debouncing is enabled. Default is true.
  - **delay**: Debounce delay in milliseconds. Default is 300ms.
  - **cancelPending**: Whether to cancel pending requests when a new one is made. Default is true.
  - **maxWait**: Maximum wait time in milliseconds. If provided, the function will be called after this time even if new requests keep coming in.

## Methods

### configure

Updates the debounce configuration.

```typescript
configure(options: DebounceOptions): void
```

#### Parameters

- **options**: The new configuration options to apply

### debounce

Debounces a request based on a key.

```typescript
debounce<T>(key: string, requestFn: (signal?: AbortSignal) => Promise<T>): Promise<T>
```

#### Parameters

- **key**: Unique key to identify similar requests (e.g., endpoint URL)
- **requestFn**: The function that performs the actual request

#### Returns

A promise that resolves with the request result or rejects if the request is cancelled

### cancelAll

Cancels all pending debounced requests.

```typescript
cancelAll(): void
```

### cancel

Cancels a specific debounced request by key.

```typescript
cancel(key: string): boolean
```

#### Parameters

- **key**: The key of the request to cancel

#### Returns

True if a request was cancelled, false otherwise

### flush

Immediately executes a debounced request without waiting for delay.

```typescript
flush<T>(key: string, requestFn: (signal?: AbortSignal) => Promise<T>): Promise<T> | undefined
```

#### Parameters

- **key**: The key of the request to flush
- **requestFn**: The function that performs the actual request

#### Returns

A promise that resolves with the request result or undefined if no request was found

## Example

```typescript
import { DebounceManager } from '@arthurmtro/openapi-tools-common';

// Create a custom debounce manager for a specific part of your application
const searchDebouncer = new DebounceManager({
  delay: 250,
  maxWait: 1000 // Maximum wait time of 1 second
});

// Function that performs the actual API call
const searchItems = async (query: string) => {
  const response = await fetch(`/api/search?q=${query}`);
  return response.json();
};

// Usage in a search component
function handleSearchInput(query: string) {
  // Use the unique query as the key
  searchDebouncer.debounce(`search:${query}`, () => searchItems(query))
    .then(results => {
      setSearchResults(results);
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        console.log('Search request was cancelled');
      } else {
        console.error('Search failed:', error);
      }
    });
}

// Clean up when no longer needed
function cleanup() {
  searchDebouncer.cancelAll();
}
```

## Notes

- The DebounceManager uses CancellationToken for cancelling requests.
- If multiple requests are made with the same key within the debounce period, only the last one will be executed.
- If `cancelPending` is enabled, in-flight requests will be cancelled when a new one is made with the same key.
- The `maxWait` option ensures that a request is executed even if new requests keep coming in, which can be useful for providing timely feedback to users.