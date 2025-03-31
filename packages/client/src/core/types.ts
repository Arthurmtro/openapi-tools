import type {
  ApiClientOptions as CommonApiClientOptions,
  HttpClient,
  HttpResponse,
  RequestOptions,
} from '@arthurmtro/openapi-tools-common';

/**
 * Request interceptor function type
 * Allows modifying or logging requests before they are sent
 */
export type RequestInterceptor = (
  config: RequestOptions,
) => RequestOptions | Promise<RequestOptions>;

/**
 * Response interceptor function type
 * Allows modifying or logging responses before they are returned to the caller
 */
export type ResponseInterceptor = (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;

/**
 * Error interceptor function type
 * Allows handling errors from requests or responses
 */
export type ErrorInterceptor = (error: unknown) => unknown | Promise<unknown>;

/**
 * Extended API client options with authentication and interceptor support
 */
export interface ApiClientOptions extends CommonApiClientOptions {
  /**
   * Authentication token or function that returns a token
   */
  auth?: string | (() => string | Promise<string>);

  /**
   * Request interceptors to be applied before sending requests
   */
  requestInterceptors?: Array<RequestInterceptor>;

  /**
   * Response interceptors to be applied after receiving responses
   */
  responseInterceptors?: Array<ResponseInterceptor>;

  /**
   * Error interceptors to be applied when requests or responses fail
   */
  errorInterceptors?: Array<ErrorInterceptor>;

  /**
   * HTTP client to use
   * If not specified, a default client will be created
   */
  httpClient?: HttpClient;

  /**
   * Type of HTTP client to create if httpClient is not provided
   * @default 'fetch'
   */
  httpClientType?: 'fetch' | 'axios';
}

/**
 * Generic API endpoint interface
 */
export interface ApiEndpoint {
  [methodName: string]: (...args: unknown[]) => Promise<unknown>;
}

/**
 * Constructor type for API endpoints that use Axios
 * This is for backward compatibility with OpenAPI Generator
 */
export interface AxiosApiEndpointConstructor {
  new (configuration?: unknown, basePath?: string, axiosInstance?: unknown): ApiEndpoint;
}

/**
 * Constructor type for API endpoints that use our HttpClient interface
 */
export interface HttpApiEndpointConstructor {
  new (configuration?: unknown, basePath?: string, httpClient?: HttpClient): ApiEndpoint;
}

/**
 * Union type for API endpoint constructors
 */
export type ApiEndpointConstructor = AxiosApiEndpointConstructor | HttpApiEndpointConstructor;

/**
 * Helper type for both endpoint instances and their constructors - used for tests or custom endpoints
 */
export type AnyEndpointClass = new (...args: any[]) => { [key: string]: (...args: any[]) => any };

/**
 * Map of API endpoints
 */
export interface ApiEndpoints {
  [key: string]: ApiEndpoint;
}

/**
 * Methods available on the API client
 */
export interface ApiClientMethods {
  /**
   * Reconfigure the client with new options
   */
  configure: (options: ApiClientOptions) => void;

  /**
   * Get the base URL
   */
  getBaseUrl: () => string | undefined;

  /**
   * Get the HTTP client instance
   */
  getHttpClient: () => HttpClient;

  /**
   * Add a request interceptor
   */
  addRequestInterceptor: (interceptor: RequestInterceptor) => number;

  /**
   * Add a response interceptor
   */
  addResponseInterceptor: (interceptor: ResponseInterceptor) => number;

  /**
   * Add an error interceptor
   */
  addErrorInterceptor: (interceptor: ErrorInterceptor) => void;
}

/**
 * Options for the OpenAPI client generator
 */
export interface GeneratorOptions {
  /**
   * Path to the OpenAPI specification file
   */
  specPath: string;

  /**
   * Directory where the generated client code will be written
   */
  outputDir: string;

  /**
   * Format of the OpenAPI specification file
   * @default Detected from file extension
   */
  format?: 'json' | 'yaml';

  /**
   * Additional generator options
   */
  options?: {
    /**
     * Naming convention for API endpoints
     * @default 'camelCase'
     */
    namingConvention?: 'camelCase' | 'kebab-case' | 'PascalCase';

    /**
     * HTTP client library to use
     * @default 'axios'
     */
    httpClient?: 'axios' | 'fetch';
  };
}