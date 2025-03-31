import { createError } from '../utils';
import type { HttpClient, HttpClientConfig, HttpResponse, RequestOptions } from './types';

/**
 * Creates a fetch-based HTTP client
 * Uses native fetch API with no additional dependencies
 *
 * @param config - Client configuration options
 * @returns HttpClient implementation using fetch
 */
export function createFetchHttpClient(config: HttpClientConfig = {}): HttpClient {
  const requestInterceptors: Array<{
    fulfilled: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>;
    rejected?: (error: unknown) => unknown;
    id: number;
  }> = [];

  const responseInterceptors: Array<{
    fulfilled: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
    rejected?: (error: unknown) => unknown;
    id: number;
  }> = [];

  let interceptorIdCounter = 0;

  // Helper to apply request interceptors
  async function applyRequestInterceptors(requestConfig: RequestOptions): Promise<RequestOptions> {
    let config = { ...requestConfig };

    for (const interceptor of requestInterceptors) {
      try {
        config = await interceptor.fulfilled(config);
      } catch (error) {
        if (interceptor.rejected) {
          const result = await interceptor.rejected(error);
          if (result instanceof Error) {
            throw result;
          }
          // If the interceptor handled the error and didn't throw, continue with the current config
          continue;
        }
        throw error;
      }
    }

    return config;
  }

  // Helper to apply response interceptors
  async function applyResponseInterceptors(response: HttpResponse): Promise<HttpResponse> {
    let result = { ...response };

    for (const interceptor of responseInterceptors) {
      try {
        result = await interceptor.fulfilled(result);
      } catch (error) {
        if (interceptor.rejected) {
          const rejectionResult = await interceptor.rejected(error);
          if (rejectionResult instanceof Error) {
            throw rejectionResult;
          }
          // If the interceptor handled the error and didn't throw, continue with the current response
          continue;
        }
        throw error;
      }
    }

    return result;
  }

  // Helper to handle errors consistently
  async function handleErrors(error: unknown, config: RequestOptions): Promise<never> {
    // Apply response interceptors' rejected handlers
    let processedError = error;

    for (const interceptor of responseInterceptors) {
      if (interceptor.rejected) {
        try {
          processedError = await interceptor.rejected(processedError);
        } catch (e) {
          processedError = e;
        }
      }
    }

    // Standardize error format
    if (processedError instanceof Error) {
      throw processedError;
    }

    // Create a standardized error
    throw createError(
      `Request failed: ${String(processedError)}`,
      (processedError as { status?: number })?.status || 0,
      (processedError as { code?: string })?.code,
      { config },
    );
  }

  // Main request method
  async function request<T = unknown>(requestConfig: RequestOptions): Promise<HttpResponse<T>> {
    try {
      // Clone and merge with base config
      const mergedConfig: RequestOptions = {
        ...requestConfig,
        headers: {
          ...config.headers,
          ...requestConfig.headers,
        },
        timeout: requestConfig.timeout ?? config.timeout,
        withCredentials: requestConfig.withCredentials ?? config.withCredentials,
      };

      // Apply base URL if provided and the URL is not absolute
      if (config.baseUrl && !requestConfig.url.startsWith('http')) {
        const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
        const url = requestConfig.url.startsWith('/') ? requestConfig.url : `/${requestConfig.url}`;
        mergedConfig.url = `${baseUrl}${url}`;
      }

      // Apply request interceptors
      const finalConfig = await applyRequestInterceptors(mergedConfig);

      // Build fetch options
      const fetchOptions: RequestInit = {
        method: finalConfig.method,
        headers: finalConfig.headers as HeadersInit,
        credentials: finalConfig.withCredentials ? 'include' : 'same-origin',
      };

      // Add request body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(finalConfig.method) && finalConfig.data) {
        fetchOptions.body =
          typeof finalConfig.data === 'string'
            ? finalConfig.data
            : JSON.stringify(finalConfig.data);

        // Add content-type header if not already set
        const headers = fetchOptions.headers as Record<string, string>;
        if (!headers['content-type'] && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      // Add query parameters
      let url = finalConfig.url;
      if (finalConfig.params && Object.keys(finalConfig.params).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(finalConfig.params)) {
          searchParams.append(key, value);
        }
        url += (url.includes('?') ? '&' : '?') + searchParams.toString();
      }

      // Handle timeouts
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        if (finalConfig.timeout) {
          timeoutId = setTimeout(() => {
            reject(
              createError(`Request timeout of ${finalConfig.timeout}ms exceeded`, 408, 'TIMEOUT'),
            );
          }, finalConfig.timeout);
        }
      });

      // Execute fetch with timeout
      const fetchPromise = fetch(url, fetchOptions);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      // Extract response data based on response type
      let data: T;
      const responseType = finalConfig.responseType || 'json';

      switch (responseType) {
        case 'text':
          data = (await response.text()) as unknown as T;
          break;
        case 'blob':
          data = (await response.blob()) as unknown as T;
          break;
        case 'arraybuffer':
          data = (await response.arrayBuffer()) as unknown as T;
          break;
        default:
          if (response.status === 204) {
            // No content
            data = null as unknown as T;
          } else {
            try {
              data = (await response.json()) as T;
            } catch (_e) {
              // If parsing JSON fails, return raw text
              data = (await response.text()) as unknown as T;
            }
          }
          break;
      }

      // Build response object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const httpResponse: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        config: finalConfig,
      };

      // Check for error status codes
      if (!response.ok) {
        throw createError(
          `Request failed with status code ${response.status}`,
          response.status,
          'REQUEST_FAILED',
          httpResponse,
        );
      }

      // Apply response interceptors
      return applyResponseInterceptors(httpResponse) as Promise<HttpResponse<T>>;
    } catch (error) {
      return handleErrors(error, requestConfig);
    }
  }

  // Rest of the HTTP methods
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

  // Interceptor management
  function addRequestInterceptor(
    onFulfilled: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>,
    onRejected?: (error: unknown) => unknown,
  ): number {
    const id = ++interceptorIdCounter;
    requestInterceptors.push({
      fulfilled: onFulfilled,
      rejected: onRejected,
      id,
    });
    return id;
  }

  function addResponseInterceptor(
    onFulfilled: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>,
    onRejected?: (error: unknown) => unknown,
  ): number {
    const id = ++interceptorIdCounter;
    responseInterceptors.push({
      fulfilled: onFulfilled,
      rejected: onRejected,
      id,
    });
    return id;
  }

  function removeInterceptor(id: number): void {
    const requestIndex = requestInterceptors.findIndex((i) => i.id === id);
    if (requestIndex !== -1) {
      requestInterceptors.splice(requestIndex, 1);
      return;
    }

    const responseIndex = responseInterceptors.findIndex((i) => i.id === id);
    if (responseIndex !== -1) {
      responseInterceptors.splice(responseIndex, 1);
    }
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
