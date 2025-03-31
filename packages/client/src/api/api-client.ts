import {
  type HttpClient,
  type RequestOptions,
  createAxiosHttpClient,
  createDefaultHttpClient,
} from '@arthurmtro/openapi-tools-common';
import type {
  ApiClientMethods,
  ApiClientOptions,
  ApiEndpoint,
  ApiEndpointConstructor,
  ApiEndpoints,
  AnyEndpointClass,
  AxiosApiEndpointConstructor,
  ErrorInterceptor,
  HttpApiEndpointConstructor,
  RequestInterceptor,
  ResponseInterceptor,
} from '../core/types';

/**
 * API client that provides access to API endpoints
 */
export class ApiClient<T extends ApiEndpoints> {
  private http: HttpClient;
  private endpoints: T;
  private options: ApiClientOptions;
  private interceptorIds: number[] = [];

  constructor(
    endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint | AnyEndpointClass>,
    options: ApiClientOptions = {},
  ) {
    this.options = options;
    this.http = this.createHttpClient();
    this.setupInterceptors();
    this.endpoints = this.initializeEndpoints(endpoints) as T;
  }

  /**
   * Creates an HTTP client instance with the configured options
   */
  private createHttpClient(): HttpClient {
    // Use the provided HTTP client if available
    if (this.options.httpClient) {
      return this.options.httpClient;
    }

    // Create a new HTTP client based on the specified type or default
    const clientType = this.options.httpClientType || 'fetch';
    if (clientType === 'axios') {
      try {
        return createAxiosHttpClient({
          baseUrl: this.options.baseUrl,
          timeout: this.options.timeout || 30000,
          headers: this.options.headers || {},
          withCredentials: this.options.withCredentials,
        });
      } catch (error) {
        console.warn('Failed to create Axios HTTP client, falling back to fetch:', error);
        // Fall back to fetch if axios is not available
        return createDefaultHttpClient({
          baseUrl: this.options.baseUrl,
          timeout: this.options.timeout || 30000,
          headers: this.options.headers || {},
          withCredentials: this.options.withCredentials,
        });
      }
    }

    // Default to fetch-based client
    return createDefaultHttpClient({
      baseUrl: this.options.baseUrl,
      timeout: this.options.timeout || 30000,
      headers: this.options.headers || {},
      withCredentials: this.options.withCredentials,
    });
  }

  /**
   * Sets up request and response interceptors
   */
  private setupInterceptors(): void {
    // Clear any existing interceptors
    this.clearInterceptors();

    // Add request interceptors
    if (this.options.requestInterceptors?.length) {
      for (const interceptor of this.options.requestInterceptors) {
        const id = this.http.addRequestInterceptor(interceptor, this.createErrorHandler());
        this.interceptorIds.push(id);
      }
    }

    // Add response interceptors
    if (this.options.responseInterceptors?.length) {
      for (const interceptor of this.options.responseInterceptors) {
        const id = this.http.addResponseInterceptor(interceptor, this.createErrorHandler());
        this.interceptorIds.push(id);
      }
    }

    // Add authentication interceptor if auth is provided
    if (this.options.auth) {
      const id = this.http.addRequestInterceptor(
        this.createAuthInterceptor(),
        this.createErrorHandler(),
      );
      this.interceptorIds.push(id);
    }
  }

  /**
   * Creates an authentication interceptor based on the auth option
   */
  private createAuthInterceptor(): RequestInterceptor {
    return async (config: RequestOptions): Promise<RequestOptions> => {
      if (!this.options.auth) {
        return config;
      }

      const token =
        typeof this.options.auth === 'function' ? await this.options.auth() : this.options.auth;

      if (token) {
        // Set the Authorization header
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          },
        };
      }

      return config;
    };
  }

  /**
   * Creates an error handler that applies error interceptors
   */
  private createErrorHandler(): ErrorInterceptor {
    return async (error: unknown): Promise<unknown> => {
      if (this.options.errorInterceptors?.length) {
        let processedError = error;

        for (const errorInterceptor of this.options.errorInterceptors) {
          try {
            processedError = await errorInterceptor(processedError);
          } catch (e) {
            processedError = e;
          }
        }

        return Promise.reject(processedError);
      }

      return Promise.reject(error);
    };
  }

  /**
   * Clears all registered interceptors
   */
  private clearInterceptors(): void {
    for (const id of this.interceptorIds) {
      this.http.removeInterceptor(id);
    }
    this.interceptorIds = [];
  }

  /**
   * Creates an adapter for an Axios-based endpoint
   * This is for backward compatibility with the OpenAPI Generator
   */
  private createAxiosAdapter(httpClient: HttpClient): unknown {
    return {
      request: (config: unknown) => {
        // Convert axios config to our RequestOptions
        const axiosConfig = config as {
          url?: string;
          method?: string;
          headers?: Record<string, string>;
          data?: unknown;
          params?: Record<string, string>;
          responseType?: string;
          timeout?: number;
          withCredentials?: boolean;
        };

        const requestOptions: RequestOptions = {
          url: axiosConfig.url || '',
          method: (axiosConfig.method?.toUpperCase() || 'GET') as RequestOptions['method'],
          headers: axiosConfig.headers || {},
          data: axiosConfig.data,
          params: axiosConfig.params,
          responseType: axiosConfig.responseType as RequestOptions['responseType'],
          timeout: axiosConfig.timeout,
          withCredentials: axiosConfig.withCredentials,
        };

        // Use our HTTP client
        return httpClient.request(requestOptions);
      },
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: () => 0,
          eject: () => {},
        },
        response: {
          use: () => 0,
          eject: () => {},
        },
      },
    };
  }

  /**
   * Initializes API endpoints with the HTTP client
   */
  private initializeEndpoints(endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint | AnyEndpointClass>): T {
    const initialized = {} as T;

    for (const [key, EndpointClass] of Object.entries(endpoints)) {
      if (typeof EndpointClass === 'function') {
        try {
          // Try to initialize as a modern endpoint with HttpClient
          initialized[key as keyof T] = new (EndpointClass as HttpApiEndpointConstructor)(
            undefined,
            this.options.baseUrl,
            this.http,
          ) as T[keyof T];
        } catch (_error) {
          // Fall back to initializing as an axios-based endpoint
          const axiosAdapter = this.createAxiosAdapter(this.http);
          initialized[key as keyof T] = new (EndpointClass as AxiosApiEndpointConstructor)(
            undefined,
            this.options.baseUrl,
            axiosAdapter,
          ) as T[keyof T];
        }
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
    // Merge options
    this.options = {
      ...this.options,
      ...options,
      // Preserve existing interceptors unless explicitly overridden
      requestInterceptors: options.requestInterceptors || this.options.requestInterceptors,
      responseInterceptors: options.responseInterceptors || this.options.responseInterceptors,
      errorInterceptors: options.errorInterceptors || this.options.errorInterceptors,
    };

    // Create a new HTTP client if needed
    if (
      options.httpClient ||
      options.baseUrl ||
      options.timeout ||
      options.headers ||
      options.withCredentials
    ) {
      this.http = this.createHttpClient();
      this.setupInterceptors();
      this.endpoints = this.initializeEndpoints(this.endpoints);
    }
  }

  /**
   * Add a request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.options.requestInterceptors = this.options.requestInterceptors || [];
    this.options.requestInterceptors.push(interceptor);

    const id = this.http.addRequestInterceptor(interceptor, this.createErrorHandler());
    this.interceptorIds.push(id);

    return id;
  }

  /**
   * Add a response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): number {
    this.options.responseInterceptors = this.options.responseInterceptors || [];
    this.options.responseInterceptors.push(interceptor);

    const id = this.http.addResponseInterceptor(interceptor, this.createErrorHandler());
    this.interceptorIds.push(id);

    return id;
  }

  /**
   * Add an error interceptor
   */
  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.options.errorInterceptors = this.options.errorInterceptors || [];
    this.options.errorInterceptors.push(interceptor);
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
  public getHttpClient(): HttpClient {
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
export function createApiClient<T extends ApiEndpoints & object>(
  endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint | AnyEndpointClass>,
  baseUrl = '',
  options = {},
): T & ApiClientMethods {
  const client = new ApiClient<T>(endpoints, {
    baseUrl,
    ...options,
  });

  // Create a proxy that handles both API endpoints and client methods
  return new Proxy({} as T & ApiClientMethods, {
    get: (_, prop: string | symbol) => {
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
      if (prop === 'addRequestInterceptor') {
        return (interceptor: RequestInterceptor) => client.addRequestInterceptor(interceptor);
      }
      if (prop === 'addResponseInterceptor') {
        return (interceptor: ResponseInterceptor) => client.addResponseInterceptor(interceptor);
      }
      if (prop === 'addErrorInterceptor') {
        return (interceptor: ErrorInterceptor) => client.addErrorInterceptor(interceptor);
      }

      // Handle API endpoints
      if (typeof prop === 'string') {
        const key = prop as keyof T;
        if (key in client.api) {
          return client.api[key];
        }
      }

      return undefined;
    },
  });
}
