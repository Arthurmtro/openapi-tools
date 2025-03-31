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
 * API client that provides access to OpenAPI-defined endpoints with advanced features
 * 
 * The `ApiClient` is the core class that handles API communication, authentication,
 * and interceptor management. It creates instances of API endpoints defined in OpenAPI
 * specifications and provides a unified interface for making API requests.
 * 
 * Features:
 * - Pluggable HTTP client architecture (fetch, axios, or custom implementations)
 * - Built-in authentication support
 * - Request/response interceptors
 * - Error handling
 * - Automatic endpoint initialization
 * 
 * @typeParam T - The type of API endpoints this client will manage
 * 
 * @group API Client
 */
export class ApiClient<T extends ApiEndpoints> {
  private http: HttpClient;
  private endpoints: T;
  private options: ApiClientOptions;
  private interceptorIds: number[] = [];

  /**
   * Creates a new API client instance with the specified endpoints and options
   * 
   * The constructor initializes the HTTP client, sets up interceptors, and
   * initializes API endpoint instances.
   * 
   * @param endpoints - A record of API endpoint constructors or instances to initialize
   * @param options - Configuration options for the API client
   * 
   * @example
   * ```typescript
   * // Create a client with PetApi and UserApi endpoints
   * const client = new ApiClient(
   *   { 
   *     pets: PetApi,
   *     users: UserApi
   *   },
   *   { 
   *     baseUrl: 'https://api.example.com',
   *     httpClientType: 'fetch',
   *     auth: async () => getAuthToken()
   *   }
   * );
   * ```
   */
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
   * 
   * This method is responsible for creating the appropriate HTTP client implementation
   * based on the specified options. It supports:
   * - Using a provided HTTP client instance directly
   * - Creating an axios-based client if requested (with fallback to fetch)
   * - Creating a fetch-based client (default)
   * 
   * @returns A configured HTTP client implementation
   * @internal
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
   * Sets up request and response interceptors on the HTTP client
   * 
   * This method configures:
   * - Request interceptors specified in options
   * - Response interceptors specified in options
   * - Authentication interceptor if auth is provided
   * 
   * It first clears any existing interceptors to prevent duplicates.
   * 
   * @internal
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
   * 
   * This interceptor adds an Authorization Bearer token to request headers.
   * The token can be provided as a static string or a function that returns
   * a token (which can be async).
   * 
   * @returns A request interceptor function that adds authentication
   * @internal
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
   * 
   * This method returns a function that processes errors through the chain
   * of error interceptors. Each interceptor can transform the error or
   * handle it in some way.
   * 
   * @returns An error handler function for interceptors
   * @internal
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
   * Clears all registered interceptors from the HTTP client
   * 
   * This method removes all previously registered interceptors based on
   * their IDs, which are stored in the `interceptorIds` array.
   * 
   * @internal
   */
  private clearInterceptors(): void {
    for (const id of this.interceptorIds) {
      this.http.removeInterceptor(id);
    }
    this.interceptorIds = [];
  }

  /**
   * Creates an adapter for an Axios-based endpoint
   * 
   * This adapter provides backward compatibility with the OpenAPI Generator's
   * axios-based TypeScript client. It translates between axios-style request
   * configuration and our internal HttpClient interface.
   * 
   * @param httpClient - The HTTP client to adapt
   * @returns An object that mimics the axios interface expected by generated clients
   * @internal
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
   * 
   * This method creates instances of each API endpoint class and provides them
   * with the current HTTP client. It handles two types of endpoints:
   * 
   * 1. Modern endpoints that accept our HttpClient interface directly
   * 2. Legacy (axios-based) endpoints that require an axios adapter
   * 
   * It uses a try-catch approach to detect which type of endpoint is being used,
   * falling back to the axios adapter if needed.
   * 
   * @param endpoints - Record of API endpoint constructors or instances
   * @returns Initialized API endpoints
   * @internal
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
   * Reconfigures the client with new options
   * 
   * This method allows updating the client configuration after initialization.
   * It merges the new options with existing ones and, if necessary, creates
   * a new HTTP client and reinitializes endpoints.
   * 
   * @param options - New configuration options to apply
   * 
   * @example
   * ```typescript
   * // Update the base URL and authentication
   * client.configure({
   *   baseUrl: 'https://api-v2.example.com',
   *   auth: 'new-auth-token'
   * });
   * ```
   * 
   * @group API Client
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
   * Adds a request interceptor to the HTTP client
   * 
   * Request interceptors allow modifying or logging request configurations
   * before they are sent to the server. They are executed in the order
   * they are added.
   * 
   * @param interceptor - The request interceptor function
   * @returns An ID that can be used to remove the interceptor
   * 
   * @example
   * ```typescript
   * // Add a request logger
   * client.addRequestInterceptor((config) => {
   *   console.log(`Making request to ${config.url}`);
   *   return config;
   * });
   * 
   * // Add headers to every request
   * client.addRequestInterceptor((config) => {
   *   return {
   *     ...config,
   *     headers: {
   *       ...config.headers,
   *       'X-Custom-Header': 'value'
   *     }
   *   };
   * });
   * ```
   * 
   * @group API Client
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.options.requestInterceptors = this.options.requestInterceptors || [];
    this.options.requestInterceptors.push(interceptor);

    const id = this.http.addRequestInterceptor(interceptor, this.createErrorHandler());
    this.interceptorIds.push(id);

    return id;
  }

  /**
   * Adds a response interceptor to the HTTP client
   * 
   * Response interceptors allow modifying or logging responses
   * after they are received from the server but before they are
   * returned to the caller. They are executed in the order they are added.
   * 
   * @param interceptor - The response interceptor function
   * @returns An ID that can be used to remove the interceptor
   * 
   * @example
   * ```typescript
   * // Add a response logger
   * client.addResponseInterceptor((response) => {
   *   console.log(`Received response with status ${response.status}`);
   *   return response;
   * });
   * 
   * // Transform response data
   * client.addResponseInterceptor((response) => {
   *   if (response.data && typeof response.data === 'object') {
   *     // Add a timestamp to all responses
   *     response.data.receivedAt = new Date().toISOString();
   *   }
   *   return response;
   * });
   * ```
   * 
   * @group API Client
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): number {
    this.options.responseInterceptors = this.options.responseInterceptors || [];
    this.options.responseInterceptors.push(interceptor);

    const id = this.http.addResponseInterceptor(interceptor, this.createErrorHandler());
    this.interceptorIds.push(id);

    return id;
  }

  /**
   * Adds an error interceptor to the API client
   * 
   * Error interceptors allow handling or transforming errors that occur
   * during request or response processing. They are executed in the order
   * they are added.
   * 
   * @param interceptor - The error interceptor function
   * 
   * @example
   * ```typescript
   * // Log errors
   * client.addErrorInterceptor((error) => {
   *   console.error('API Error:', error);
   *   return Promise.reject(error); // Re-throw the error
   * });
   * 
   * // Transform error objects
   * client.addErrorInterceptor((error) => {
   *   // Add a timestamp to the error
   *   const enhancedError = {
   *     ...error,
   *     timestamp: new Date().toISOString()
   *   };
   *   return Promise.reject(enhancedError);
   * });
   * 
   * // Retry on specific errors
   * client.addErrorInterceptor(async (error) => {
   *   if (error.status === 401) {
   *     // Refresh token and retry
   *     await refreshToken();
   *     // The original request will be retried
   *   }
   *   return Promise.reject(error);
   * });
   * ```
   * 
   * @group API Client
   */
  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.options.errorInterceptors = this.options.errorInterceptors || [];
    this.options.errorInterceptors.push(interceptor);
  }

  /**
   * Gets the base URL used for API requests
   * 
   * @returns The configured base URL or undefined if not set
   * @group API Client
   */
  public getBaseUrl(): string | undefined {
    return this.options.baseUrl;
  }

  /**
   * Gets the HTTP client instance used by this API client
   * 
   * This can be useful for advanced use cases where you need direct
   * access to the underlying HTTP client.
   * 
   * @returns The HTTP client instance
   * @group API Client
   */
  public getHttpClient(): HttpClient {
    return this.http;
  }

  /**
   * Gets access to the API endpoints
   * 
   * This property provides access to all initialized API endpoints.
   * It's primarily used internally by the proxy created in `createApiClient`.
   * 
   * @returns An object containing all initialized API endpoints
   * @group API Client
   */
  public get api(): T {
    return this.endpoints;
  }
}

/**
 * Creates a typed API client instance with direct access to API endpoints
 * 
 * This function creates a proxied API client that allows direct access to
 * API endpoints as properties of the returned object, as well as access to
 * the client methods themselves.
 *
 * @param endpoints - Record of API endpoint constructors or instances
 * @param baseUrl - Base URL for API requests
 * @param options - Additional client options
 * @returns An object that combines API endpoints and client methods
 * 
 * @example
 * ```typescript
 * // Import generated API classes
 * import { PetApi, StoreApi, UserApi } from './generated';
 * 
 * // Create the client with direct access to endpoints
 * const client = createApiClient(
 *   {
 *     pets: PetApi,
 *     store: StoreApi,
 *     users: UserApi
 *   },
 *   'https://api.example.com',
 *   {
 *     httpClientType: 'fetch',
 *     auth: 'my-api-token',
 *     headers: {
 *       'X-App-Version': '1.0.0'
 *     }
 *   }
 * );
 * 
 * // Access API endpoints directly as properties
 * const pets = await client.pets.findByStatus('available');
 * 
 * // You can also access client methods directly
 * client.addRequestInterceptor((config) => {
 *   console.log(`Request to: ${config.url}`);
 *   return config;
 * });
 * ```
 * 
 * @group API Client
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
