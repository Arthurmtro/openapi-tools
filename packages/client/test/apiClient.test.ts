import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, createApiClient } from '../src/api/api-client';
import { type HttpClient, type HttpResponse, type RequestOptions } from '@arthurmtro/openapi-tools-common';
import type { ApiEndpoint, RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from '../src/core/types';

// Mock HTTP client
class MockHttpClient implements HttpClient {
  public requestMock = vi.fn().mockImplementation(async (config) => {
    return {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      config,
    };
  });
  
  public interceptors: {
    request: Array<{ 
      onFulfilled: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>;
      onRejected?: (error: unknown) => unknown;
    }>;
    response: Array<{
      onFulfilled: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
      onRejected?: (error: unknown) => unknown;
    }>;
  } = {
    request: [],
    response: [],
  };

  constructor() {
    this.interceptors.request = [];
    this.interceptors.response = [];
  }

  request<T = unknown>(config: RequestOptions): Promise<HttpResponse<T>> {
    // Apply request interceptors
    let finalConfig = { ...config };
    for (const interceptor of this.interceptors.request) {
      try {
        finalConfig = interceptor.onFulfilled(finalConfig) as RequestOptions;
      } catch (error) {
        if (interceptor.onRejected) {
          interceptor.onRejected(error);
        }
        throw error;
      }
    }
    
    return this.requestMock(finalConfig) as Promise<HttpResponse<T>>;
  }

  get<T = unknown>(url: string, config?: Omit<RequestOptions, 'url' | 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      ...config
    });
  }

  post<T = unknown>(url: string, data?: unknown, config?: Omit<RequestOptions, 'url' | 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config
    });
  }

  put<T = unknown>(url: string, data?: unknown, config?: Omit<RequestOptions, 'url' | 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config
    });
  }

  delete<T = unknown>(url: string, config?: Omit<RequestOptions, 'url' | 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config
    });
  }

  patch<T = unknown>(url: string, data?: unknown, config?: Omit<RequestOptions, 'url' | 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config
    });
  }

  addRequestInterceptor(
    onFulfilled: (config: RequestOptions) => RequestOptions | Promise<RequestOptions>,
    onRejected?: (error: unknown) => unknown
  ): number {
    const id = this.interceptors.request.length;
    this.interceptors.request.push({ onFulfilled, onRejected });
    return id;
  }

  addResponseInterceptor(
    onFulfilled: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>,
    onRejected?: (error: unknown) => unknown
  ): number {
    const id = this.interceptors.response.length;
    this.interceptors.response.push({ onFulfilled, onRejected });
    return id;
  }

  removeInterceptor(id: number): void {
    // Simple implementation for testing
  }
}

// Use a type assertion to create a mock API endpoint
class MockPetApiBase {
  // Store properties privately without exposing them via index signature
  #config?: unknown;
  #baseUrl?: string;
  #httpClient?: HttpClient;
  
  constructor(
    config?: unknown,
    baseUrl?: string,
    httpClient?: HttpClient,
  ) {
    this.#config = config;
    this.#baseUrl = baseUrl;
    this.#httpClient = httpClient;
  }

  getPets = vi.fn().mockImplementation(() => {
    if (!this.#httpClient) throw new Error('HTTP client not provided');
    return this.#httpClient.get('/pets');
  });

  addPet = vi.fn().mockImplementation((pet: unknown) => {
    if (!this.#httpClient) throw new Error('HTTP client not provided');
    return this.#httpClient.post('/pets', pet);
  });

  getPetById = vi.fn().mockImplementation((id: string) => {
    if (!this.#httpClient) throw new Error('HTTP client not provided');
    return this.#httpClient.get(`/pets/${id}`);
  });
}

// Use TypeScript's type assertion to satisfy the ApiEndpoint interface
const MockPetApi = MockPetApiBase as unknown as { 
  new(config?: unknown, basePath?: string, httpClient?: HttpClient): ApiEndpoint 
};

// Basic tests for ApiClient with HTTP client abstraction
describe('ApiClient with HttpClient abstraction', () => {
  let mockHttpClient: MockHttpClient;

  beforeEach(() => {
    mockHttpClient = new MockHttpClient();
    vi.spyOn(mockHttpClient, 'request');
    vi.spyOn(mockHttpClient, 'get');
    vi.spyOn(mockHttpClient, 'post');
    vi.spyOn(mockHttpClient, 'addRequestInterceptor');
    vi.spyOn(mockHttpClient, 'addResponseInterceptor');
    vi.spyOn(mockHttpClient, 'removeInterceptor');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create an API client with a custom HTTP client', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      { 
        baseUrl: 'https://api.example.com',
        httpClient: mockHttpClient,
      },
    );

    expect(client.getHttpClient()).toBe(mockHttpClient);
  });

  it('should initialize endpoints with the HTTP client', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        baseUrl: 'https://api.example.com',
        httpClient: mockHttpClient,
      },
    );

    // Assert the type to be compatible with the MockPetApiBase class for testing
    const petsApi = client.api.pets as unknown as MockPetApiBase;
    petsApi.getPets();

    expect(mockHttpClient.get).toHaveBeenCalledWith('/pets');
  });

  it('should add request interceptors to the HTTP client', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        httpClient: mockHttpClient,
      },
    );

    const interceptor: RequestInterceptor = (config) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: 'Bearer test-token',
        },
      };
    };

    client.addRequestInterceptor(interceptor);

    expect(mockHttpClient.addRequestInterceptor).toHaveBeenCalled();
    expect(mockHttpClient.interceptors.request.length).toBeGreaterThan(0);
  });

  it('should add response interceptors to the HTTP client', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        httpClient: mockHttpClient,
      },
    );

    const interceptor: ResponseInterceptor = (response) => {
      // Handle potential primitive data that can't be spread
      const originalData = typeof response.data === 'object' && response.data !== null 
        ? response.data as Record<string, unknown>
        : {};
        
      return {
        ...response,
        data: {
          ...originalData,
          intercepted: true,
        },
      };
    };

    client.addResponseInterceptor(interceptor);

    expect(mockHttpClient.addResponseInterceptor).toHaveBeenCalled();
    expect(mockHttpClient.interceptors.response.length).toBeGreaterThan(0);
  });

  it('should set up auth interceptors properly', () => {
    const authFn = vi.fn().mockResolvedValue('dynamic-token');

    // Create the client with auth
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        httpClient: mockHttpClient,
        auth: authFn,
      },
    );

    // Verify an interceptor was added to the HTTP client
    expect(mockHttpClient.addRequestInterceptor).toHaveBeenCalled();
    
    // The auth option should have been stored in the client
    expect((client as any).options.auth).toBe(authFn);
  });

  it('should clear interceptors when reconfiguring', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        httpClient: mockHttpClient,
      },
    );

    // Add some interceptors
    client.addRequestInterceptor((config) => config);
    client.addResponseInterceptor((response) => response);

    // Create a new mock HTTP client for reconfiguration
    const newMockHttpClient = new MockHttpClient();
    vi.spyOn(newMockHttpClient, 'addRequestInterceptor');
    vi.spyOn(newMockHttpClient, 'addResponseInterceptor');
    vi.spyOn(newMockHttpClient, 'removeInterceptor');

    // Reconfigure with a new HTTP client
    client.configure({
      httpClient: newMockHttpClient,
    });

    // New client should have had interceptors added
    expect(newMockHttpClient.addRequestInterceptor).toHaveBeenCalled();
    expect(newMockHttpClient.addResponseInterceptor).toHaveBeenCalled();
  });

  it('should create a proxied client with createApiClient', () => {
    const client = createApiClient(
      {
        pets: MockPetApi,
      },
      'https://api.example.com',
      {
        httpClient: mockHttpClient,
      },
    );

    // Access API endpoint directly
    expect(client.pets).toBeDefined();
    client.pets.getPets();
    expect(mockHttpClient.get).toHaveBeenCalledWith('/pets');

    // Access client methods directly
    expect(client.getBaseUrl()).toBe('https://api.example.com');
    expect(client.getHttpClient()).toBe(mockHttpClient);
  });

  it('should handle initialize endpoints with axios adapter for backward compatibility', () => {
    // Create a mock Axios-based endpoint base class
    class AxiosEndpointBase {
      // Use private fields
      #axios: unknown;
      #config?: unknown;
      #baseUrl?: string;

      constructor(
        config?: unknown,
        baseUrl?: string,
        axiosInstance?: unknown
      ) {
        this.#config = config;
        this.#baseUrl = baseUrl;
        this.#axios = axiosInstance;
      }

      getResource = vi.fn().mockImplementation(() => {
        return (this.#axios as any).request({ url: '/resource', method: 'GET' });
      });
    }
    
    // Use TypeScript's type assertion to satisfy the ApiEndpoint interface
    const AxiosEndpoint = AxiosEndpointBase as unknown as {
      new(config?: unknown, basePath?: string, axiosInstance?: unknown): ApiEndpoint 
    };

    // Create client with an endpoint that expects Axios
    const client = new ApiClient(
      {
        legacy: AxiosEndpoint,
      },
      {
        httpClient: mockHttpClient,
      },
    );

    // Use the legacy endpoint - cast to base class for testing
    const legacyApi = client.api.legacy as unknown as AxiosEndpointBase;
    legacyApi.getResource();

    // The adapter should convert the Axios request to our HTTP client
    expect(mockHttpClient.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/resource',
        method: 'GET',
      })
    );
  });
});