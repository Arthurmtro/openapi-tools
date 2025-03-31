# cancelAllDebouncedRequests

Cancels all pending debounced requests.

## Description

This function cancels all pending debounced requests that have been created with the `debounceRequest` function or using the DebounceManager. It's useful for scenarios like component unmounting or page navigation, where you want to ensure that no more API calls will be made.

## Signature

```typescript
function cancelAllDebouncedRequests(): void
```

## Parameters

None.

## Returns

This function does not return a value.

## Example

```typescript
import { debounceRequest, cancelAllDebouncedRequests } from '@arthurmtro/openapi-tools-common';

// Create a debounced search function
const debouncedSearch = debounceRequest(
  (query: string) => client.search.searchItems({ query }),
  300 // 300ms delay
);

// In a React component
function SearchComponent() {
  // ...
  
  // Example usage in component cleanup
  React.useEffect(() => {
    return () => {
      // Cancel all debounced requests when component unmounts
      cancelAllDebouncedRequests();
    };
  }, []);
  
  // ... rest of component
}
```

## Notes

- This function will cancel all debounced requests across the entire application that use the default DebounceManager.
- Any promises returned by debounced functions that are cancelled will be rejected with a cancellation error.
- This function is useful for cleanup in single-page applications when navigating between routes or unmounting components.