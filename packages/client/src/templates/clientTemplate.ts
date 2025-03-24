/**
 * Template for generating the client.ts file
 */
export function generateClientTemplate(
  importPath: string,
  imports: string,
  apiReExports: string,
  apiClientsEntries: string,
  apiEndpointsProps: string
): string {
  return `/**
 * GENERATED CODE - DO NOT MODIFY
 * Generated by openapi-typed-client
 */
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { Configuration } from '${importPath}/configuration';
${imports}

// Re-export API classes individually
${apiReExports}

// Re-export models
export * from '${importPath}/models';

// API client configuration options
export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  auth?: string | (() => string | Promise<string>);
}

// Group API classes for initialization
export const API_CLIENTS = {
${apiClientsEntries}
};

// Define the type for all API endpoints
export type ApiEndpoints = {
${apiEndpointsProps}
};

// Define the client methods
export interface ApiClientMethods {
  configure: (options: ApiClientOptions) => void;
  getBaseUrl: () => string | undefined;
  getHttpClient: () => AxiosInstance;
}

/**
 * API client that provides access to API endpoints
 */
export class ApiClient {
  private http: AxiosInstance;
  private endpoints: Record<string, unknown>;
  private options: ApiClientOptions;

  constructor(endpoints: Record<string, unknown>, options: ApiClientOptions = {}) {
    this.options = options;
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(endpoints);
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout || 30000,
      headers: this.options.headers || {},
      withCredentials: this.options.withCredentials
    });
  }

  private initializeEndpoints(endpoints: Record<string, unknown>): Record<string, unknown> {
    const initialized: Record<string, unknown> = {};

    for (const [key, EndpointClass] of Object.entries(endpoints)) {
      if (typeof EndpointClass === 'function') {
        initialized[key] = new (EndpointClass as any)(
          new Configuration(),
          this.options.baseUrl,
          this.http
        );
      } else {
        initialized[key] = EndpointClass;
      }
    }

    return initialized;
  }

  public configure(options: ApiClientOptions): void {
    Object.assign(this.options, options);
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(this.endpoints);
  }

  public getBaseUrl(): string | undefined {
    return this.options.baseUrl;
  }

  public getHttpClient(): AxiosInstance {
    return this.http;
  }

  public getEndpoints<T>(): T {
    return this.endpoints as T;
  }

  /**
   * Creates a proxied client for direct access to API endpoints and client methods
   */
  public static createClient<T>(
    endpoints: Record<string, unknown>,
    options: ApiClientOptions = {}
  ): T & ApiClientMethods {
    const client = new ApiClient(endpoints, options);

    return new Proxy({} as T & ApiClientMethods, {
      get: (_, prop) => {
        // Handle client methods
        if (prop === 'configure') {
          return (newOptions: ApiClientOptions) => client.configure(newOptions);
        }
        if (prop === 'getBaseUrl') {
          return () => client.getBaseUrl();
        }
        if (prop === 'getHttpClient') {
          return () => client.getHttpClient();
        }

        // Handle API endpoints
        const endpoints = client.getEndpoints<T>();
        const key = prop as keyof T;
        if (key in endpoints) {
          return endpoints[key];
        }

        return undefined;
      }
    });
  }
}

/**
 * Create a typed API client instance
 */
export const createApiClient = (baseUrl = '', options = {}): ApiEndpoints & ApiClientMethods => {
  return ApiClient.createClient<ApiEndpoints>(API_CLIENTS, {
    baseUrl,
    ...options
  });
};

// Create a default client instance
export const api = createApiClient();
`;
}
