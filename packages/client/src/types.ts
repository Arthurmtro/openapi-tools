import type { ApiClientOptions as BaseApiClientOptions } from '@openapi-tools/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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
  specPath: string;
  outputDir: string;
  format?: 'json' | 'yaml';
  options?: {
    namingConvention?: 'camelCase' | 'kebab-case' | 'PascalCase';
    httpClient?: 'axios' | 'fetch';
  };
}
