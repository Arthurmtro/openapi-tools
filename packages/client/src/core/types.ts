import type {
  ApiClientOptions as CommonApiClientOptions,
  HttpClient,
  HttpResponse,
  RequestOptions,
} from '@arthurmtro/openapi-tools-common';

/**
 * Request interceptor function type
 *
 * A function that intercepts HTTP requests before they are sent, allowing
 * you to modify, log, or handle the request in some way.
 *
 * @param config - The request configuration to intercept
 * @returns The modified request configuration (can be async)
 *
 * @example
 * ```typescript
 * const addApiKeyInterceptor: RequestInterceptor = (config) => {
 *   return {
 *     ...config,
 *     headers: {
 *       ...config.headers,
 *       'X-API-Key': 'your-api-key'
 *     }
 *   };
 * };
 * ```
 *
 * @group Types
 */
export type RequestInterceptor = (
  config: RequestOptions,
) => RequestOptions | Promise<RequestOptions>;

/**
 * Response interceptor function type
 *
 * A function that intercepts HTTP responses before they are returned to the caller,
 * allowing you to modify, log, or handle the response in some way.
 *
 * @param response - The HTTP response to intercept
 * @returns The modified HTTP response (can be async)
 *
 * @example
 * ```typescript
 * const responseLogger: ResponseInterceptor = (response) => {
 *   console.log(`Received response from ${response.config.url} with status ${response.status}`);
 *   return response;
 * };
 *
 * const dataTransformer: ResponseInterceptor = (response) => {
 *   // Transform data if it's a list response
 *   if (Array.isArray(response.data)) {
 *     response.data = response.data.map(item => ({
 *       ...item,
 *       transformedAt: new Date().toISOString()
 *     }));
 *   }
 *   return response;
 * };
 * ```
 *
 * @group Types
 */
export type ResponseInterceptor = (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;

/**
 * Error interceptor function type
 *
 * A function that intercepts errors from HTTP requests or responses,
 * allowing you to handle, transform, or log errors before they are
 * propagated to the caller.
 *
 * @param error - The error to intercept
 * @returns The handled or transformed error (can be async)
 *
 * @example
 * ```typescript
 * const errorLogger: ErrorInterceptor = (error) => {
 *   console.error('API error occurred:', error);
 *   return Promise.reject(error); // Rethrow the error
 * };
 *
 * const errorTransformer: ErrorInterceptor = (error) => {
 *   // Add a user-friendly message based on status code
 *   if (error.status === 404) {
 *     error.userMessage = 'The requested resource was not found';
 *   } else if (error.status === 401) {
 *     error.userMessage = 'Please log in to access this resource';
 *   }
 *   return Promise.reject(error);
 * };
 *
 * const tokenRefresher: ErrorInterceptor = async (error) => {
 *   if (error.status === 401 && !error._isRetry) {
 *     // Try to refresh the token
 *     await refreshAuthToken();
 *
 *     // Mark the error to prevent infinite retry loops
 *     error._isRetry = true;
 *
 *     // Retry the original request
 *     return apiClient.getHttpClient().request(error.config);
 *   }
 *   return Promise.reject(error);
 * };
 * ```
 *
 * @group Types
 */
export type ErrorInterceptor = (error: unknown) => unknown | Promise<unknown>;

/**
 * Extended API client options with authentication and interceptor support
 *
 * This interface extends the common API client options with additional
 * configuration for authentication and interceptors.
 *
 * @example
 * ```typescript
 * const clientOptions: ApiClientOptions = {
 *   // Base configuration
 *   baseUrl: 'https://api.example.com',
 *   timeout: 30000,
 *   headers: {
 *     'X-App-Version': '1.0.0'
 *   },
 *
 *   // HTTP client configuration
 *   httpClientType: 'fetch', // or 'axios'
 *   // Or provide a custom implementation
 *   // httpClient: customHttpClient,
 *
 *   // Authentication
 *   auth: 'Bearer token123', // Static token
 *   // Or a function that returns a token (can be async)
 *   // auth: async () => getTokenFromStorage(),
 *
 *   // Interceptors
 *   requestInterceptors: [
 *     (config) => ({ ...config, headers: { ...config.headers, 'X-Trace-ID': generateTraceId() } })
 *   ],
 *   responseInterceptors: [
 *     (response) => {
 *       console.log(`Response from ${response.config.url}: ${response.status}`);
 *       return response;
 *     }
 *   ],
 *   errorInterceptors: [
 *     (error) => {
 *       console.error('API error:', error);
 *       return Promise.reject(error);
 *     }
 *   ]
 * };
 * ```
 *
 * @group Types
 */
export interface ApiClientOptions extends CommonApiClientOptions {
  /**
   * Authentication token or function that returns a token
   *
   * This can be a static token string or a function that returns a token.
   * The function can be async, allowing for token refresh or retrieval from
   * storage or an authentication service.
   *
   * @example
   * ```typescript
   * // Static token
   * auth: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   *
   * // Function that returns a token
   * auth: () => localStorage.getItem('auth_token')
   *
   * // Async function that fetches a token
   * auth: async () => {
   *   if (isTokenExpired()) {
   *     await refreshToken();
   *   }
   *   return getToken();
   * }
   * ```
   */
  auth?: string | (() => string | Promise<string>);

  /**
   * Request interceptors to be applied before sending requests
   *
   * These interceptors are applied in the order they are defined in the array.
   * Each interceptor can modify the request before it is sent.
   *
   * @see RequestInterceptor
   */
  requestInterceptors?: Array<RequestInterceptor>;

  /**
   * Response interceptors to be applied after receiving responses
   *
   * These interceptors are applied in the order they are defined in the array.
   * Each interceptor can modify the response before it is returned to the caller.
   *
   * @see ResponseInterceptor
   */
  responseInterceptors?: Array<ResponseInterceptor>;

  /**
   * Error interceptors to be applied when requests or responses fail
   *
   * These interceptors are applied in the order they are defined in the array.
   * Each interceptor can handle or transform errors before they are propagated.
   *
   * @see ErrorInterceptor
   */
  errorInterceptors?: Array<ErrorInterceptor>;

  /**
   * HTTP client to use for API requests
   *
   * If provided, this HTTP client will be used instead of creating a new one.
   * This allows you to provide a custom HTTP client implementation that
   * conforms to the HttpClient interface.
   *
   * @see HttpClient
   */
  httpClient?: HttpClient;

  /**
   * Type of HTTP client to create if httpClient is not provided
   *
   * This determines which built-in HTTP client implementation to use.
   *
   * - 'fetch': Uses the native fetch API (default, zero dependencies)
   * - 'axios': Uses axios (requires axios to be installed)
   *
   * If 'axios' is specified but not available, it will fall back to 'fetch'.
   *
   * @default 'fetch'
   */
  httpClientType?: 'fetch' | 'axios';
}

/**
 * Generic API endpoint interface
 *
 * Represents the common structure of an API endpoint, which is a collection
 * of methods that make API requests. This is a minimal interface that allows
 * for any method names and arguments.
 *
 * @group Types
 */
export interface ApiEndpoint {
  [methodName: string]: (...args: unknown[]) => Promise<unknown>;
}

/**
 * Constructor type for API endpoints that use Axios
 *
 * This interface is for backward compatibility with OpenAPI Generator's
 * axios-based TypeScript client.
 *
 * @group Types
 */
export interface AxiosApiEndpointConstructor {
  new (configuration?: unknown, basePath?: string, axiosInstance?: unknown): ApiEndpoint;
}

/**
 * Constructor type for API endpoints that use our HttpClient interface
 *
 * This interface represents the constructor for API endpoints that accept
 * our HttpClient interface directly.
 *
 * @group Types
 */
export interface HttpApiEndpointConstructor {
  new (configuration?: unknown, basePath?: string, httpClient?: HttpClient): ApiEndpoint;
}

/**
 * Union type for API endpoint constructors
 *
 * This type represents either an axios-based or HttpClient-based endpoint constructor.
 *
 * @group Types
 */
export type ApiEndpointConstructor = AxiosApiEndpointConstructor | HttpApiEndpointConstructor;

/**
 * Helper type for both endpoint instances and their constructors
 *
 * This is a more permissive type used for tests or custom endpoints.
 * It allows for any constructor args and any methods on the resulting instance.
 *
 * @group Types
 */
export type AnyEndpointClass = new (...args: any[]) => { [key: string]: (...args: any[]) => any };

/**
 * Map of API endpoints
 *
 * This interface represents a collection of API endpoints, where the keys
 * are the endpoint names and the values are the endpoint instances.
 *
 * @example
 * ```typescript
 * // Example of an ApiEndpoints object
 * const endpoints: ApiEndpoints = {
 *   pets: new PetApi(config, baseUrl, httpClient),
 *   users: new UserApi(config, baseUrl, httpClient),
 *   stores: new StoreApi(config, baseUrl, httpClient)
 * };
 * ```
 *
 * @group Types
 */
export interface ApiEndpoints {
  [key: string]: ApiEndpoint;
}

/**
 * Methods available on the API client
 *
 * This interface defines the methods that are directly accessible on the
 * API client instance created by `createApiClient`.
 *
 * @group Types
 */
export interface ApiClientMethods {
  /**
   * Reconfigure the client with new options
   *
   * @param options - New configuration options to apply
   */
  configure: (options: ApiClientOptions) => void;

  /**
   * Get the base URL used for API requests
   *
   * @returns The configured base URL or undefined if not set
   */
  getBaseUrl: () => string | undefined;

  /**
   * Get the HTTP client instance
   *
   * @returns The HTTP client instance used by this API client
   */
  getHttpClient: () => HttpClient;

  /**
   * Add a request interceptor
   *
   * @param interceptor - The request interceptor function
   * @returns An ID that can be used to remove the interceptor
   */
  addRequestInterceptor: (interceptor: RequestInterceptor) => number;

  /**
   * Add a response interceptor
   *
   * @param interceptor - The response interceptor function
   * @returns An ID that can be used to remove the interceptor
   */
  addResponseInterceptor: (interceptor: ResponseInterceptor) => number;

  /**
   * Add an error interceptor
   *
   * @param interceptor - The error interceptor function
   */
  addErrorInterceptor: (interceptor: ErrorInterceptor) => void;

  /**
   * Enable or disable response caching
   *
   * @param enabled - Whether caching should be enabled
   * @param options - Additional cache configuration options
   */
  configureCaching: (enabled: boolean, options?: { ttl?: number; maxEntries?: number }) => void;

  /**
   * Clear the response cache completely or by URL pattern
   *
   * @param urlPattern - Optional URL pattern to clear (supports string or RegExp)
   */
  clearCache: (urlPattern?: string | RegExp) => void;

  /**
   * Configure rate limiting (throttling) for API requests
   *
   * @param enabled - Whether throttling should be enabled
   * @param options - Additional throttling configuration options
   */
  configureThrottling: (
    enabled: boolean,
    options?: {
      limit?: number;
      interval?: number;
      strategy?: 'queue' | 'error';
    },
  ) => void;

  /**
   * Configure automatic retry for failed requests
   *
   * @param enabled - Whether automatic retry should be enabled
   * @param options - Additional retry configuration options
   */
  configureRetry: (
    enabled: boolean,
    options?: {
      maxRetries?: number;
      statusCodes?: number[];
    },
  ) => void;

  /**
   * Configure request batching for similar requests
   *
   * @param enabled - Whether request batching should be enabled
   * @param options - Additional batching configuration options
   */
  configureBatching: (
    enabled: boolean,
    options?: {
      maxBatchSize?: number;
      debounceTime?: number;
    },
  ) => void;

  /**
   * Set the API client's logger level
   *
   * @param level - The log level to use (silent/error/warn/info/debug)
   */
  setLogLevel: (level: 'silent' | 'error' | 'warn' | 'info' | 'debug') => void;
}

/**
 * Options for the OpenAPI client generator
 *
 * This interface defines the configuration options for generating
 * API clients from OpenAPI specifications.
 *
 * @example
 * ```typescript
 * // Generate a client with custom options
 * await generateClient({
 *   specPath: './swagger/petstore.yaml',
 *   outputDir: './src/api',
 *   format: 'yaml',
 *   options: {
 *     httpClient: 'fetch'
 *   }
 * });
 * ```
 *
 * @group Generator
 */
export interface GeneratorOptions {
  /**
   * Path to the OpenAPI specification file
   *
   * This can be a JSON or YAML file that contains the OpenAPI specification.
   * Both local file paths and HTTP URLs are supported.
   *
   * @example
   * ```
   * specPath: './specs/petstore.yaml'
   * specPath: '/absolute/path/to/api.json'
   * ```
   */
  specPath: string;

  /**
   * Directory where the generated client code will be written
   *
   * This directory will be created if it doesn't exist. The generator
   * will create subdirectories within this directory for models and APIs.
   *
   * @example
   * ```
   * outputDir: './src/api'
   * outputDir: './generated'
   * ```
   */
  outputDir: string;

  /**
   * Format of the OpenAPI specification file
   *
   * By default, the format is detected from the file extension. You can
   * override this by specifying the format explicitly.
   *
   * @default Detected from file extension
   */
  format?: 'json' | 'yaml';

  /**
   * Additional generator options
   *
   * These options control various aspects of the code generation process.
   */
  options?: {
    /**
     * HTTP client library to use in the generated client
     *
     * - 'axios': Use axios (requires axios as a dependency)
     * - 'fetch': Use native fetch (zero dependencies)
     *
     * @default 'fetch'
     */
    httpClient?: 'axios' | 'fetch';

    /**
     * Advanced HTTP client options
     *
     * Configure caching, retries, rate limiting, and other advanced features.
     * These settings will be passed to the HTTP client during initialization.
     */
    httpClientOptions?: {
      /**
       * Cache options for HTTP requests
       *
       * Configure in-memory caching for HTTP responses to improve performance
       * and reduce API load.
       */
      cache?: {
        /**
         * Whether caching is enabled
         * @default false
         */
        enabled?: boolean;

        /**
         * TTL (time to live) in milliseconds
         * @default 60000 (1 minute)
         */
        ttl?: number;

        /**
         * Maximum number of entries to cache
         * @default 100
         */
        maxEntries?: number;

        /**
         * Methods that can be cached
         * @default ['GET']
         */
        methods?: Array<'GET' | 'HEAD' | 'OPTIONS'>;
      };

      /**
       * Retry options for failed requests
       *
       * Configure automatic retries for failed requests to improve resilience.
       */
      retry?: {
        /**
         * Whether retry is enabled
         * @default false
         */
        enabled?: boolean;

        /**
         * Maximum number of retry attempts
         * @default 3
         */
        maxRetries?: number;

        /**
         * Status codes that should trigger a retry
         * @default [408, 429, 500, 502, 503, 504]
         */
        statusCodes?: number[];
      };

      /**
       * Throttling options for rate limiting
       *
       * Configure client-side rate limiting to prevent API quota issues.
       */
      throttle?: {
        /**
         * Whether throttling is enabled
         * @default false
         */
        enabled?: boolean;

        /**
         * Maximum number of requests allowed in the specified interval
         * @default 60
         */
        limit?: number;

        /**
         * Time interval in milliseconds for the rate limit
         * @default 60000 (1 minute)
         */
        interval?: number;

        /**
         * Strategy to use when rate limit is exceeded
         * @default 'queue'
         */
        strategy?: 'queue' | 'error';
      };
    };

    /**
     * Enable request batching
     *
     * When enabled, similar requests will be batched together to reduce
     * API load and improve performance.
     *
     * @default false
     */
    enableBatching?: boolean;
    
    /**
     * Enable enhanced logger
     * 
     * When enabled, the client will use an enhanced logger with better error formatting,
     * error type classification, and colored output. This improves debugging and error
     * handling, but increases the bundle size.
     * 
     * @default false
     */
    enableEnhancedLogger?: boolean;
    
    /**
     * Enable request cancellation
     * 
     * When enabled, the client will support cancelling in-flight requests using 
     * AbortController/AbortSignal. This is useful for scenarios like search-as-you-type
     * or when users navigate away from a page with pending requests.
     * 
     * @default false
     */
    enableCancellation?: boolean;
    
    /**
     * Enable request debouncing
     * 
     * When enabled, the client will include utilities for debouncing API requests.
     * This is useful for search-as-you-type or other scenarios where you want to 
     * prevent multiple requests being made in quick succession.
     * 
     * @default false
     */
    enableDebounce?: boolean;

    /**
     * Log level to use for client logging
     *
     * Control the verbosity of logs produced by the client.
     *
     * @default 'info'
     */
    logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';
  };
}
