import type { HttpClient, HttpClientConfig } from './http-types';
import { createFetchAdapter } from '../adapters/fetch-adapter';

/**
 * Creates the appropriate HTTP client based on the specified type
 *
 * @param type - The type of HTTP client to create
 * @param config - Client configuration options
 * @returns The requested HTTP client implementation
 */
export function createHttpClient(
  type: 'fetch' | 'axios' = 'fetch',
  config: HttpClientConfig = {},
): HttpClient {
  switch (type) {
    case 'fetch':
      return createFetchAdapter(config);
    case 'axios':
      try {
        // Dynamic import for the axios adapter
        // This approach keeps axios as an optional dependency
        const { createAxiosAdapter } = require('../adapters/axios-adapter');
        return createAxiosAdapter(config);
      } catch (error) {
        console.warn('Failed to create Axios HTTP client, falling back to fetch:', error);
        return createFetchAdapter(config);
      }
    default:
      throw new Error(`Unsupported HTTP client type: ${type}`);
  }
}

/**
 * Creates the default HTTP client
 * Currently uses fetch as the default implementation
 *
 * @param config - Client configuration options
 * @returns The default HTTP client implementation
 */
export function createDefaultHttpClient(config: HttpClientConfig = {}): HttpClient {
  return createFetchAdapter(config);
}

/**
 * Lazy export for the axios HTTP client creator
 * This function will throw an error if axios is not installed
 */
export function createAxiosHttpClient(config: HttpClientConfig = {}): HttpClient {
  try {
    const { createAxiosAdapter } = require('../adapters/axios-adapter');
    return createAxiosAdapter(config);
  } catch (_error) {
    throw new Error(
      'axios is required for createAxiosHttpClient but was not found. Please install axios.',
    );
  }
}
