/**
 * Base HTTP client configuration options
 */
export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
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