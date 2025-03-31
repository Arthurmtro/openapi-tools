/**
 * HTTP module that provides HTTP client implementations and utilities
 */

// Export core types and interfaces
export type {
  HttpClient,
  HttpClientConfig,
  HttpResponse,
  RequestOptions,
  CancellationOptions,
  DebounceOptions,
} from './core/http-types';

// Export HTTP client factory functions
export {
  createHttpClient,
  createDefaultHttpClient,
  createAxiosHttpClient,
} from './core/http-client';

// Export adapter functions for direct usage
export { createFetchAdapter } from './adapters/fetch-adapter';

// Export utility functions and classes
export * from './utils';

// Note: axios adapter is not directly exported because it requires axios as a dependency
// It's available through the createAxiosHttpClient function instead
