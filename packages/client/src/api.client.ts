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
  private endpoints!: T;
  private options: ApiClientOptions;
  private interceptorIds: number[] = [];
  private endpointInstances: Record<string, any> = {};

  constructor(endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint>, options: ApiClientOptions = {}) {
    this.options = {
      requestInterceptors: [],
      responseInterceptors: [],
      errorInterceptors: [],
      ...options
    };
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
        // Store the original endpoint instance
        const instance = new (EndpointClass as ApiEndpointConstructor)(
          undefined,
          this.options.baseUrl,
          this.http
        );
        
        this.endpointInstances[key] = instance;
        
        // Create a proxy for each endpoint to intercept method calls
        initialized[key as keyof T] = new Proxy(instance, {
          get: (target, prop: string | symbol) => {
            const propKey = prop.toString();
            // Use type assertion to handle both string and symbol properties
            const value = (target as any)[propKey];
            
            if (typeof value === 'function' && propKey !== 'constructor') {
              // Return a function that will use the current HTTP client
              return (...args: any[]) => {
                // Override the axios instance used by the endpoint
                if (typeof (target as any).setAxiosInstance === 'function') {
                  (target as any).setAxiosInstance(this.http);
                } else {
                  // If setAxiosInstance doesn't exist, we need to patch the request method
                  this.patchRequestMethod(target);
                }
                
                return value.apply(target, args);
              };
            }
            return value;
          }
        }) as T[keyof T];
      } else {
        initialized[key as keyof T] = EndpointClass as T[keyof T];
      }
    }

    return initialized;
  }

  /**
   * Patch the request method of an endpoint to use our HTTP client
   */
  private patchRequestMethod(endpoint: any): void {
    // Store the original request method if it exists
    if (typeof endpoint.request === 'function' && !endpoint._originalRequest) {
      endpoint._originalRequest = endpoint.request;
      
      // Override the request method to use our HTTP client
      endpoint.request = (config: AxiosRequestConfig) => {
        return this.http.request(config);
      };
    }
  }

  /**
   * Reconfigure the client with new options
   */
  public configure(options: ApiClientOptions): void {
    // Preserve existing interceptors unless explicitly overridden
    this.options = {
      ...this.options,
      ...options,
      requestInterceptors: options.requestInterceptors || this.options.requestInterceptors,
      responseInterceptors: options.responseInterceptors || this.options.responseInterceptors,
      errorInterceptors: options.errorInterceptors || this.options.errorInterceptors
    };
    
    // Create a new HTTP client with updated options
    this.http = this.createHttpClient();
    this.setupInterceptors();
    
    // Update all endpoint instances to use the new HTTP client
    for (const instance of Object.values(this.endpointInstances)) {
      if (typeof instance.setAxiosInstance === 'function') {
        instance.setAxiosInstance(this.http);
      } else {
        this.patchRequestMethod(instance);
      }
    }
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
export function createApiClient<T extends ApiEndpoints>(
  endpoints: Record<string, ApiEndpointConstructor | ApiEndpoint>,
  baseUrl = '',
  options = {}
): T & ApiClientMethods {
  const client = new ApiClient<T>(endpoints, {
    baseUrl,
    ...options
  });

  // Create a proxy that handles both API endpoints and client methods
  const proxy = new Proxy({} as any, {
    get: (_, prop: string | symbol) => {
      const propKey = prop.toString();
      
      // Handle client methods
      if (propKey === 'configure') {
        return (newOptions: ApiClientOptions) => client.configure(newOptions);
      }
      if (propKey === 'getBaseUrl') {
        return () => client.getBaseUrl();
      }
      if (propKey === 'getHttpClient') {
        return () => client.getHttpClient();
      }
      if (propKey === 'addRequestInterceptor') {
        return (interceptor: RequestInterceptor) => client.addRequestInterceptor(interceptor);
      }
      if (propKey === 'addResponseInterceptor') {
        return (interceptor: ResponseInterceptor) => client.addResponseInterceptor(interceptor);
      }
      if (propKey === 'addErrorInterceptor') {
        return (interceptor: ErrorInterceptor) => client.addErrorInterceptor(interceptor);
      }

      // Handle API endpoints
      // Convert the property to a string to handle both string and symbol keys
      const stringKey = propKey.replace(/^Symbol\((.*)\)$/, '$1');
      
      // Check if the key exists in the API endpoints
      for (const key in client.api) {
        if (key === stringKey) {
          return client.api[key as keyof T];
        }
      }

      return undefined;
    }
  });

  return proxy as T & ApiClientMethods;
}
