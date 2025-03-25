import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { 
  ApiClientOptions, 
  ApiEndpoint, 
  ApiEndpointConstructor, 
  ApiEndpoints,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  ApiClientMethods
} from './types';

/**
 * API client that provides access to API endpoints
 */
export class ApiClient<T extends ApiEndpoints> {
  private http: AxiosInstance;
  private endpoints: T;
  private options: ApiClientOptions;
  private interceptorIds: number[] = [];

  constructor(endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint>, options: ApiClientOptions = {}) {
    this.options = options;
    this.http = this.createHttpClient();
    this.setupInterceptors();
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
   * Sets up request and response interceptors
   */
  private setupInterceptors(): void {
    // Clear any existing interceptors
    this.clearInterceptors();
    
    // Add request interceptors
    if (this.options.requestInterceptors?.length) {
      for (const interceptor of this.options.requestInterceptors) {
        const id = this.http.interceptors.request.use(
          interceptor,
          this.createErrorHandler()
        );
        this.interceptorIds.push(id);
      }
    }

    // Add response interceptors
    if (this.options.responseInterceptors?.length) {
      for (const interceptor of this.options.responseInterceptors) {
        const id = this.http.interceptors.response.use(
          interceptor,
          this.createErrorHandler()
        );
        this.interceptorIds.push(id);
      }
    }

    // Add authentication interceptor if auth is provided
    if (this.options.auth) {
      const id = this.http.interceptors.request.use(
        this.createAuthInterceptor(),
        this.createErrorHandler()
      );
      this.interceptorIds.push(id);
    }
  }

  /**
   * Creates an authentication interceptor based on the auth option
   */
  private createAuthInterceptor(): RequestInterceptor {
    return async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
      if (!this.options.auth) {
        return config;
      }

      const token = typeof this.options.auth === 'function'
        ? await this.options.auth()
        : this.options.auth;

      if (token) {
        // Set the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    };
  }

  /**
   * Creates an error handler that applies error interceptors
   */
  private createErrorHandler(): ErrorInterceptor {
    return async (error: any): Promise<any> => {
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
      this.http.interceptors.request.eject(id);
      this.http.interceptors.response.eject(id);
    }
    this.interceptorIds = [];
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
    this.setupInterceptors();
    this.endpoints = this.initializeEndpoints(this.endpoints);
  }

  /**
   * Add a request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.options.requestInterceptors = this.options.requestInterceptors || [];
    this.options.requestInterceptors.push(interceptor);
    
    const id = this.http.interceptors.request.use(
      interceptor,
      this.createErrorHandler()
    );
    this.interceptorIds.push(id);
    
    return id;
  }

  /**
   * Add a response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): number {
    this.options.responseInterceptors = this.options.responseInterceptors || [];
    this.options.responseInterceptors.push(interceptor);
    
    const id = this.http.interceptors.response.use(
      interceptor,
      this.createErrorHandler()
    );
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
export function createApiClient<T extends ApiEndpoints & object>(
  endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint>,
  baseUrl = '',
  options = {}
): T & ApiClientMethods {
  const client = new ApiClient<T>(endpoints, {
    baseUrl,
    ...options
  });

  // Create a proxy that handles both API endpoints and client methods
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
      const key = prop as keyof T;
      if (key in client.api) {
        return client.api[key];
      }

      return undefined;
    }
  });
}
