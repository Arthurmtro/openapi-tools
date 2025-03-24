import type { ApiClientOptions as BaseApiClientOptions } from '@openapi-tools/common';
import type { AxiosInstance } from 'axios';

/**
 * Extended API client options with authentication support
 */
export interface ApiClientOptions extends BaseApiClientOptions {
  auth?: string | (() => string | Promise<string>);
}

/**
 * Generic API endpoint interface
 */
export interface ApiEndpoint {
  [methodName: string]: (...args: unknown[]) => Promise<unknown>;
}

/**
 * Constructor type for API endpoints
 */
export interface ApiEndpointConstructor {
  new (configuration?: unknown, basePath?: string, axiosInstance?: AxiosInstance): ApiEndpoint;
}

/**
 * Map of API endpoints
 */
export interface ApiEndpoints {
  [key: string]: ApiEndpoint;
}

/**
 * Options for the OpenAPI client generator
 */
export interface GeneratorOptions {
  /**
   * Path to the OpenAPI specification file
   */
  specPath: string;
  
  /**
   * Directory where the generated client code will be written
   */
  outputDir: string;
  
  /**
   * Format of the OpenAPI specification file
   * @default Detected from file extension
   */
  format?: 'json' | 'yaml';
  
  /**
   * Additional generator options
   */
  options?: {
    /**
     * Naming convention for API endpoints
     * @default 'camelCase'
     */
    namingConvention?: 'camelCase' | 'kebab-case' | 'PascalCase';
    
    /**
     * HTTP client library to use
     * @default 'axios'
     */
    httpClient?: 'axios' | 'fetch';
  };
}
