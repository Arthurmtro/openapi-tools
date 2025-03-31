/**
 * Configuration for OpenAPI tools
 */
export interface OpenAPIConfig {
  specPath: string;
  outputDir: string;
  format?: 'json' | 'yaml';
}

// Import types needed for ApiClientOptions
import type { HttpClient, HttpClientConfig } from './http/types';

/**
 * Re-export HTTP client types for backward compatibility
 */
export type { HttpClient, HttpClientConfig, HttpResponse, RequestOptions } from './http/types';

/**
 * API client options extending HTTP client configuration
 */
export interface ApiClientOptions extends HttpClientConfig {
  /**
   * HTTP client implementation to use
   * If not provided, defaults to Fetch
   */
  httpClient?: HttpClient;
}
