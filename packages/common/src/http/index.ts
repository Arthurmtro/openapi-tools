/**
 * HTTP module that provides HTTP client implementations and utilities
 */

// Export core types and interfaces
export type {
  HttpClient,
  HttpClientConfig,
  HttpResponse,
  RequestOptions
} from './core/http-types';

// Export HTTP client factory functions
export {
  createHttpClient,
  createDefaultHttpClient,
  createAxiosHttpClient
} from './core/http-client';

// Export adapter functions for direct usage
export { createFetchAdapter } from './adapters/fetch-adapter';

// Note: axios adapter is not directly exported because it requires axios as a dependency
// It's available through the createAxiosHttpClient function instead