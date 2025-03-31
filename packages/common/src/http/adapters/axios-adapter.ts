import { createError } from '../../utils/error';
import type {
  HttpClient,
  HttpClientConfig,
  HttpResponse,
  RequestOptions,
} from '../core/http-types';

// Types for Axios - these are defined inline to avoid requiring axios as a dependency
// Exporting for testing purposes but these are not part of the public API
export interface AxiosInstance {
  request: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;
  defaults: {
    headers: {
      common: Record<string, string>;
    };
  };
  interceptors: {
    request: {
      use: (
        onFulfilled: (
          config: InternalAxiosRequestConfig,
        ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>,
        onRejected?: (error: unknown) => unknown,
      ) => number;
      eject: (id: number) => void;
    };
    response: {
      use: (
        onFulfilled: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
        onRejected?: (error: unknown) => unknown,
      ) => number;
      eject: (id: number) => void;
    };
  };
}

export interface AxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: InternalAxiosRequestConfig;
}

export interface InternalAxiosRequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, string>;
  responseType?: string;
  timeout?: number;
  withCredentials?: boolean;
  baseURL?: string; // Addition to support axios
  signal?: AbortSignal; // Support for AbortSignal
}

/**
 * Adapter type to handle axios imports dynamically,
 * which allows using this adapter only when axios is available
 */
export interface AxiosAdapter {
  create: (config: Partial<InternalAxiosRequestConfig>) => AxiosInstance;
}

/**
 * Creates an Axios-based HTTP client
 * This requires axios to be installed as a dependency
 *
 * @param config - Client configuration options
 * @param axiosLib - Optional axios library instance
 * @returns HttpClient implementation using axios
 */
export function createAxiosAdapter(
  config: HttpClientConfig = {},
  axiosLib?: AxiosAdapter,
): HttpClient {
  // Import axios dynamically if not provided
  let axios = axiosLib;
  if (!axios) {
    try {
      // Dynamic import for axios, to avoid requiring it as a dependency
      // This allows users who don't use the axios adapter to not need axios installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      axios = require('axios') as AxiosAdapter;
    } catch (_e) {
      throw new Error(
        'axios is required for createAxiosAdapter but was not found. Please install axios.',
      );
    }
  }

  // Create axios instance
  const axiosInstance = axios.create({
    // Axios uses baseURL instead of baseUrl
    baseURL: config.baseUrl,
    timeout: config.timeout || 30000,
    headers: config.headers || {},
    withCredentials: config.withCredentials,
  } as Partial<InternalAxiosRequestConfig>); // Type safe conversion

  // Map of interceptor IDs
  const interceptorIds = new Map<number, { type: 'request' | 'response'; id: number }>();
  let interceptorIdCounter = 0;

  // Convert axios response to HttpResponse
  function mapAxiosResponse<T>(response: AxiosResponse<T>): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: mapToRequestOptions(response.config),
    };
  }

  // Convert RequestOptions to axios config
  function mapToAxiosConfig(options: RequestOptions): InternalAxiosRequestConfig {
    return {
      url: options.url,
      method: options.method,
      headers: options.headers,
      data: options.data,
      params: options.params,
      responseType: options.responseType,
      timeout: options.timeout,
      withCredentials: options.withCredentials,
      signal: options.signal, // Add AbortSignal for request cancellation
    };
  }

  // Convert axios config to RequestOptions
  function mapToRequestOptions(axiosConfig: InternalAxiosRequestConfig): RequestOptions {
    return {
      url: axiosConfig.url || '',
      method: (axiosConfig.method?.toUpperCase() || 'GET') as RequestOptions['method'],
      headers: axiosConfig.headers || {},
      data: axiosConfig.data,
      params: axiosConfig.params,
      responseType: axiosConfig.responseType as RequestOptions['responseType'],
      timeout: axiosConfig.timeout,
      withCredentials: axiosConfig.withCredentials,
      signal: axiosConfig.signal, // Pass AbortSignal for cancellation
    };
  }

  // Main request method
  async function request<T = unknown>(requestConfig: RequestOptions): Promise<HttpResponse<T>> {
    try {
      const axiosConfig = mapToAxiosConfig(requestConfig);
      const response = await axiosInstance.request(axiosConfig);
      return mapAxiosResponse(response) as HttpResponse<T>;
    } catch (error: unknown) {
      // Handle axios error
      const axiosError = error as { response?: AxiosResponse; request?: unknown; message?: string };
      if (axiosError.response) {
        // Request was made and server responded with a status code outside of 2xx range
        const mappedResponse = mapAxiosResponse(axiosError.response);
        throw createError(
          `Request failed with status code ${axiosError.response.status}`,
          axiosError.response.status,
          'REQUEST_FAILED',
          mappedResponse,
        );
      }
      if (axiosError.request) {
        // Request was made but no response was received
        throw createError('No response received from server', 0, 'NO_RESPONSE', {
          config: requestConfig,
        });
      }
      // Something happened in setting up the request
      throw createError(axiosError.message || 'Request failed', 0, 'REQUEST_SETUP_ERROR', {
        config: requestConfig,
      });
    }
  }

  // HTTP methods
  function get<T = unknown>(
    url: string,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>> {
    return request<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  function post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>> {
    return request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }

  function put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>> {
    return request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }

  function patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>> {
    return request<T>({
      url,
      method: 'PATCH',
      data,
      ...config,
    });
  }

  function deleteRequest<T = unknown>(
    url: string,
    config?: Omit<RequestOptions, 'url' | 'method'>,
  ): Promise<HttpResponse<T>> {
    return request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  // Interceptor to convert between HttpClient and axios interfaces
  function addRequestInterceptor(
    onFulfilled: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>,
    onRejected?: (error: unknown) => unknown,
  ): number {
    const id = ++interceptorIdCounter;

    // Create adapter for axios interceptor
    const axiosInterceptor = axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Convert axios config to RequestOptions
        const options = mapToRequestOptions(config);

        // Apply the interceptor
        const result = await onFulfilled(options);

        // Convert back to axios config
        return {
          ...config,
          ...mapToAxiosConfig(result),
        };
      },
      onRejected,
    );

    // Store the mapping
    interceptorIds.set(id, { type: 'request', id: axiosInterceptor });

    return id;
  }

  function addResponseInterceptor(
    onFulfilled: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>,
    onRejected?: (error: unknown) => unknown,
  ): number {
    const id = ++interceptorIdCounter;

    // Create adapter for axios interceptor
    const axiosInterceptor = axiosInstance.interceptors.response.use(
      async (response: AxiosResponse) => {
        // Convert axios response to HttpResponse
        const httpResponse = mapAxiosResponse(response);

        // Apply the interceptor
        const result = await onFulfilled(httpResponse);

        // Return original response with modified data
        return {
          ...response,
          data: result.data,
          status: result.status,
          statusText: result.statusText,
          headers: result.headers,
        };
      },
      onRejected,
    );

    // Store the mapping
    interceptorIds.set(id, { type: 'response', id: axiosInterceptor });

    return id;
  }

  function removeInterceptor(id: number): void {
    const mapping = interceptorIds.get(id);
    if (!mapping) return;

    if (mapping.type === 'request') {
      axiosInstance.interceptors.request.eject(mapping.id);
    } else {
      axiosInstance.interceptors.response.eject(mapping.id);
    }

    interceptorIds.delete(id);
  }

  return {
    request,
    get,
    post,
    put,
    delete: deleteRequest,
    patch,
    addRequestInterceptor,
    addResponseInterceptor,
    removeInterceptor,
  };
}
