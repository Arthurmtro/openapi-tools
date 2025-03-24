import axios, { type AxiosInstance } from 'axios';
import type { ApiClientOptions, ApiEndpoint, ApiEndpointConstructor, ApiEndpoints } from './types';

/**
 * API client that provides access to API endpoints
 */
export class ApiClient<T extends ApiEndpoints> {
  private http: AxiosInstance;
  private endpoints: T;
  private options: ApiClientOptions;

  constructor(endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint>, options: ApiClientOptions = {}) {
    this.options = options;
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(endpoints) as T;
  }

  /**
   * Creates an Axios HTTP client instance with the configured options
   */
  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout || 30000,
      headers: this.options.headers || {},
      withCredentials: this.options.withCredentials,
    });
  }

  /**
   * Initializes API endpoints with the HTTP client
   */
  private initializeEndpoints(endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint>): T {
    const initialized = {} as T;

    for (const [key, EndpointClass] of Object.entries(endpoints)) {
      if (typeof EndpointClass === 'function') {
        initialized[key as keyof T] = new (EndpointClass as ApiEndpointConstructor)(
          undefined,
          this.options.baseUrl,
          this.http
        ) as T[keyof T];
      } else {
        initialized[key as keyof T] = EndpointClass as T[keyof T];
      }
    }

    return initialized;
  }

  /**
   * Reconfigure the client with new options
   */
  public configure(options: ApiClientOptions): void {
    Object.assign(this.options, options);
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(this.endpoints);
  }

  /**
   * Get the base URL
   */
  public getBaseUrl(): string | undefined {
    return this.options.baseUrl;
  }

  /**
   * Get the HTTP client instance
   */
  public getHttpClient(): AxiosInstance {
    return this.http;
  }

  /**
   * Get access to the API endpoints
   */
  public get api(): T {
    return this.endpoints;
  }
}

/**
 * Create a typed API client instance with direct access to API endpoints
 * 
 * @param endpoints - Record of API endpoint constructors or instances
 * @param baseUrl - Base URL for API requests
 * @param options - Additional client options
 * @returns Proxied client with direct access to API endpoints and client methods
 */
export function createApiClient<T extends ApiEndpoints>(
  endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint>,
  baseUrl = '',
  options = {}
): T & Pick<ApiClient<T>, 'configure' | 'getBaseUrl' | 'getHttpClient'> {
  const client = new ApiClient<T>(endpoints, {
    baseUrl,
    ...options
  });

  // Create a proxy that handles both API endpoints and client methods
  return new Proxy({} as T & Pick<ApiClient<T>, 'configure' | 'getBaseUrl' | 'getHttpClient'>, {
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
      const key = prop as keyof T;
      if (key in client.api) {
        return client.api[key];
      }

      return undefined;
    }
  });
}
