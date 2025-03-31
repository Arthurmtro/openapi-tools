/**
 * Cache configuration options for HTTP requests
 */
export interface CacheOptions {
  /**
   * Whether caching is enabled
   * @default false
   */
  enabled?: boolean;

  /**
   * Cache key generator function
   * Takes request options and returns a string key for cache lookup
   * @default Uses URL + method + sorted query params as key
   */
  keyGenerator?: (options: RequestOptions) => string;

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
}

/**
 * Retry configuration options for failed requests
 */
export interface RetryOptions {
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
   * Delay between retries in milliseconds or a function to calculate delay
   * @default 1000
   */
  retryDelay?: number | ((retryCount: number, error: unknown) => number);

  /**
   * Status codes that should trigger a retry
   * @default [408, 429, 500, 502, 503, 504]
   */
  statusCodes?: number[];

  /**
   * Methods that can be retried
   * @default ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']
   */
  methods?: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'>;
}

/**
 * Options for request throttling and rate limiting
 */
export interface ThrottleOptions {
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
   * - 'queue': Queue requests and process them when possible
   * - 'error': Reject requests when rate limit is exceeded
   * @default 'queue'
   */
  strategy?: 'queue' | 'error';

  /**
   * Maximum queue size when using 'queue' strategy
   * @default 100
   */
  maxQueueSize?: number;
}

export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  cache?: CacheOptions;
  retry?: RetryOptions;
  throttle?: ThrottleOptions;
}

/**
 * Request options for HTTP client
 */
export interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  timeout?: number;
  withCredentials?: boolean;
}

/**
 * Common response interface for HTTP clients
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestOptions;
}

/**
 * HTTP client interface abstraction
 */
export interface HttpClient {
  request<T = unknown>(config: RequestOptions): Promise<HttpResponse<T>>;

  get<T = unknown>(
    url: string,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>>;

  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>>;

  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>>;

  delete<T = unknown>(
    url: string,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>>;

  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>>;

  /**
   * Add interceptor to modify requests before they are sent
   */
  addRequestInterceptor(
    onFulfilled: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>,
    onRejected?: (error: unknown) => unknown,
  ): number;

  /**
   * Add interceptor to modify responses before they are returned
   */
  addResponseInterceptor(
    onFulfilled: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>,
    onRejected?: (error: unknown) => unknown,
  ): number;

  /**
   * Remove interceptor by ID
   */
  removeInterceptor(id: number): void;
}
