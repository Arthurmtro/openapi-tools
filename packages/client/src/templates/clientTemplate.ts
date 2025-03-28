/**
 * Template for generating the client.ts file
 */
export function generateClientTemplate(
  importPath: string,
  imports: string,
  apiReExports: string,
  apiClientsEntries: string,
  apiEndpointsProps: string,
): string {
  return `/**
 * GENERATED CODE - DO NOT MODIFY
 * Generated by openapi-typed-client
 */
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { Configuration } from '${importPath}/configuration';
${imports}

// Re-export API classes individually
${apiReExports}

// Re-export models
export * from '${importPath}/models';

/**
 * Request interceptor function type
 * Allows modifying or logging requests before they are sent
 */
export type RequestInterceptor = (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

/**
 * Response interceptor function type
 * Allows modifying or logging responses before they are returned to the caller
 */
export type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;

/**
 * Error interceptor function type
 * Allows handling errors from requests or responses
 */
export type ErrorInterceptor = (error: any) => any | Promise<any>;

// API client configuration options
export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  auth?: string | (() => string | Promise<string>);
  requestInterceptors?: Array<RequestInterceptor>;
  responseInterceptors?: Array<ResponseInterceptor>;
  errorInterceptors?: Array<ErrorInterceptor>;
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
  addRequestInterceptor: (interceptor: RequestInterceptor) => number;
  addResponseInterceptor: (interceptor: ResponseInterceptor) => number;
  addErrorInterceptor: (interceptor: ErrorInterceptor) => void;
}

/**
 * Patch the OpenAPI generated classes to properly handle Axios instance updates
 */
function patchApiClass(apiClass: any, axiosInstance: AxiosInstance): any {
  // Add a method to set the axios instance
  apiClass.setAxiosInstance = function(newAxiosInstance: AxiosInstance) {
    this.axios = newAxiosInstance;
  };
  
  // Set the initial axios instance
  apiClass.setAxiosInstance(axiosInstance);
  
  return apiClass;
}

/**
 * API client that provides access to API endpoints
 */
export class ApiClient {
  private http: AxiosInstance;
  private endpoints: Record<string, unknown>;
  private options: ApiClientOptions;
  private interceptorIds: number[] = [];
  private endpointInstances: Record<string, any> = {};

  constructor(endpoints: Record<string, unknown>, options: ApiClientOptions = {}) {
    this.options = {
      requestInterceptors: [],
      responseInterceptors: [],
      errorInterceptors: [],
      ...options
    };
    this.http = this.createHttpClient();
    this.setupInterceptors();
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
        config.headers.Authorization = \`Bearer \${token}\`;
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

  private initializeEndpoints(endpoints: Record<string, unknown>): Record<string, unknown> {
    const initialized: Record<string, unknown> = {};

    for (const [key, EndpointClass] of Object.entries(endpoints)) {
      if (typeof EndpointClass === 'function') {
        // Create a new instance of the endpoint class with the current HTTP client
        const instance = new (EndpointClass as any)(
          new Configuration(),
          this.options.baseUrl,
          this.http
        );
        
        // Store the original instance
        this.endpointInstances[key] = instance;
        
        // Add a method to set the axios instance if it doesn't exist
        if (typeof instance.setAxiosInstance !== 'function') {
          instance.setAxiosInstance = function(newAxiosInstance: AxiosInstance) {
            this.axios = newAxiosInstance;
          };
        }
        
        // Create a proxy for each endpoint method to ensure it uses the current HTTP client
        initialized[key] = new Proxy(instance, {
          get: (target, prop: string | symbol) => {
            const propKey = prop.toString();
            const value = (target as any)[propKey];
            
            // If the property is a function (API method), wrap it to ensure it uses the current HTTP client
            if (typeof value === 'function' && propKey !== 'constructor') {
              return (...args: any[]) => {
                // Make sure the endpoint uses the current HTTP client
                target.setAxiosInstance(this.http);
                
                // If the method uses a request method internally, patch it
                this.patchRequestMethod(target);
                
                return value.apply(target, args);
              };
            }
            
            return value;
          }
        });
      } else {
        initialized[key] = EndpointClass;
      }
    }

    return initialized;
  }

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

  public getBaseUrl(): string | undefined {
    return this.options.baseUrl;
  }

  public getHttpClient(): AxiosInstance {
    return this.http;
  }

  public getEndpoints<T extends object>(): T {
    return this.endpoints as T;
  }

  /**
   * Creates a proxied client for direct access to API endpoints and client methods
   */
  public static createClient<T extends object>(
    endpoints: Record<string, unknown>,
    options: ApiClientOptions = {}
  ): T & ApiClientMethods {
    const client = new ApiClient(endpoints, options);

    return new Proxy({} as T & ApiClientMethods, {
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
        const endpoints = client.getEndpoints<T>();
        const stringKey = propKey.replace(/^Symbol\((.*)\)$/, '$1');
        
        // Check if the key exists in the API endpoints
        for (const key in endpoints) {
          if (key === stringKey) {
            return endpoints[key as keyof T];
          }
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
