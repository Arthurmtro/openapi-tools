import type { ApiClientOptions as BaseApiClientOptions } from '@openapi-tools/common';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiClientOptions extends BaseApiClientOptions {
  auth?: string | (() => string | Promise<string>);
}

// Define a more flexible endpoint type
export interface ApiEndpoint {
  [methodName: string]: (...args: unknown[]) => Promise<unknown>;
}

// Constructor type with proper typing relationship to its instances
export interface ApiEndpointConstructor {
  new (configuration?: unknown, basePath?: string, axiosInstance?: AxiosInstance): ApiEndpoint;
}

// Revised endpoints mapping type
export interface ApiEndpoints {
  [key: string]: ApiEndpointConstructor | ApiEndpoint;
}

// Interface for an API endpoint class constructor
export interface ApiEndpointClass {
  new (
    configuration?: unknown,
    basePath?: string,
    axiosInstance?: AxiosInstance
  ): ApiEndpointInstance;
}

// Interface for an instantiated API endpoint
export interface ApiEndpointInstance {
  [methodName: string]: (...args: unknown[]) => Promise<AxiosResponse<unknown>>;
}

export interface HttpClient {
  request<TResponse>(config: AxiosRequestConfig): Promise<AxiosResponse<TResponse>>;
  getInstance(): AxiosInstance;
}

export interface GeneratorOptions {
  specPath: string;
  outputDir: string;
  format?: 'json' | 'yaml';
  options?: {
    namingConvention?: 'camelCase' | 'kebab-case' | 'PascalCase';
    httpClient?: 'axios' | 'fetch';
  };
}
