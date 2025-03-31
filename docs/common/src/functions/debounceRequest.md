# debounceRequest

Creates a debounced version of an API request function.

## Description

This function creates a debounced version of an API request function. When the debounced function is called multiple times in rapid succession, only the last call will be executed after the specified delay has passed.

This is particularly useful for scenarios like search-as-you-type interfaces, where you want to limit the number of API calls made as the user types.

## Signature

```typescript
function debounceRequest<T extends (...args: any[]) => Promise<any>>(
  requestFn: T,
  delay: number = 300,
  options: Omit<DebounceOptions, 'delay'> = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>>
```

## Parameters

- **requestFn**: The function to debounce. This should be a function that makes an API request and returns a Promise.
- **delay**: Debounce delay in milliseconds. Default is 300ms.
- **options**: Additional debounce options:
  - **enabled**: Whether debouncing is enabled. Default is true.
  - **cancelPending**: Whether to cancel pending requests when a new one is made. Default is true.
  - **maxWait**: Maximum wait time in milliseconds. If provided, the function will be called after this time even if new requests keep coming in.

## Returns

A debounced version of the input function that returns a Promise.

## Example

```typescript
import { debounceRequest } from '@arthurmtro/openapi-tools-common';

// Create a client
const client = createApiClient('https://api.example.com');

// Create a debounced search function
const debouncedSearch = debounceRequest(
  (query: string) => client.search.searchItems({ query }),
  300 // 300ms delay
);

// Usage in a search input onChange handler
function handleSearchInputChange(event) {
  const query = event.target.value;
  
  // This will only execute the last call after 300ms of inactivity
  debouncedSearch(query)
    .then(results => {
      setSearchResults(results);
    })
    .catch(error => {
      console.error('Search failed:', error);
    });
}
```

## Notes

- If a debounced function is called multiple times, earlier calls will be cancelled and their promises will be rejected.
- Only the last call within the debounce period will be executed.
- If `cancelPending` is true, any in-flight request will be cancelled when a new request is made.
- The `maxWait` option can be used to ensure that a request is made after a certain period, even if new calls keep coming in.
- Use `cancelAllDebouncedRequests()` to cancel all pending debounced requests.