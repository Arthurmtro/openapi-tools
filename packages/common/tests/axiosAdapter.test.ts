import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createAxiosHttpClient } from '../src/http/axiosAdapter';
import type { HttpClient } from '../src/http/types';

// Import the interfaces for better typing
import type {
  AxiosAdapter,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from '../src/http/axiosAdapter';

// Skip this test suite if running in a CI environment without axios installed
describe('HttpClient - Axios Implementation', () => {
  let httpClient: HttpClient;
  // Define properly typed mocks
  type MockedAxiosRequest = Mock<(config: InternalAxiosRequestConfig) => Promise<AxiosResponse>>;
  type MockedInterceptorUse = Mock<(fn: any) => number>;

  interface MockedAxiosInstance extends Omit<AxiosInstance, 'request'> {
    request: MockedAxiosRequest;
    interceptors: {
      request: {
        use: MockedInterceptorUse;
        eject: Mock;
      };
      response: {
        use: MockedInterceptorUse;
        eject: Mock;
      };
    };
  }

  let mockAxiosInstance: MockedAxiosInstance;
  interface MockedAxiosAdapter extends Omit<AxiosAdapter, 'create'> {
    create: Mock<(config: Partial<InternalAxiosRequestConfig>) => MockedAxiosInstance>;
  }

  let mockAxios: MockedAxiosAdapter;

  beforeEach(() => {
    // Create a fully typed mock axios instance with all the methods we need
    mockAxiosInstance = {
      request: vi.fn() as MockedAxiosRequest,
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: vi.fn((_fn) => 1) as MockedInterceptorUse,
          eject: vi.fn() as Mock,
        },
        response: {
          use: vi.fn((_fn) => 2) as MockedInterceptorUse,
          eject: vi.fn() as Mock,
        },
      },
    };

    // Create a mock axios factory
    mockAxios = {
      create: vi.fn(() => mockAxiosInstance) as Mock<
        (config: Partial<InternalAxiosRequestConfig>) => MockedAxiosInstance
      >,
    };

    // Create a fresh client with our mock axios
    httpClient = createAxiosHttpClient(
      {
        baseUrl: 'https://api.example.com',
        timeout: 1000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key',
        },
      },
      mockAxios
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create an axios instance with the correct config', () => {
    expect(mockAxios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
      timeout: 1000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key',
      },
      withCredentials: undefined,
    });
  });

  it('should make GET requests correctly', async () => {
    const mockResponse: AxiosResponse = {
      data: { id: 1, name: 'Test' },
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      config: {} as InternalAxiosRequestConfig,
    };

    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    const response = await httpClient.get('/users/1');

    expect(mockAxiosInstance.request).toHaveBeenCalledWith({
      url: '/users/1',
      method: 'GET',
      headers: undefined,
      data: undefined,
      params: undefined,
      responseType: undefined,
      timeout: undefined,
      withCredentials: undefined,
    });

    expect(response).toEqual({
      data: { id: 1, name: 'Test' },
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      config: expect.any(Object),
    });
  });

  it('should make POST requests with data', async () => {
    const requestData = { name: 'New Test' };
    const mockResponse: AxiosResponse = {
      data: { id: 2, name: 'New Test' },
      status: 201,
      statusText: 'Created',
      headers: { 'Content-Type': 'application/json' },
      config: {} as InternalAxiosRequestConfig,
    };

    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    const response = await httpClient.post('/users', requestData);

    expect(mockAxiosInstance.request).toHaveBeenCalledWith({
      url: '/users',
      method: 'POST',
      data: requestData,
      headers: undefined,
      params: undefined,
      responseType: undefined,
      timeout: undefined,
      withCredentials: undefined,
    });

    expect(response).toEqual({
      data: { id: 2, name: 'New Test' },
      status: 201,
      statusText: 'Created',
      headers: { 'Content-Type': 'application/json' },
      config: expect.any(Object),
    });
  });

  it('should support adding request interceptors', async () => {
    const mockResponse: AxiosResponse = {
      data: { id: 1, name: 'Test' },
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
      config: {} as InternalAxiosRequestConfig,
    };

    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    // Add a request interceptor
    const interceptor = vi.fn((config) => {
      return {
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'custom-value',
        },
      };
    });

    httpClient.addRequestInterceptor(interceptor);

    // Verify interceptor was added
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();

    // Make a request
    await httpClient.get('/users/1');

    // We can't easily verify the interceptor was applied due to the mocking,
    // but we can at least check the request was made
    expect(mockAxiosInstance.request).toHaveBeenCalled();
  });

  it('should handle axios errors correctly', async () => {
    // Simulate an axios error with response
    const mockError = {
      response: {
        data: { message: 'Not found' },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      } as AxiosResponse,
      isAxiosError: true,
    };

    mockAxiosInstance.request.mockRejectedValue(mockError);

    await expect(httpClient.get('/users/999')).rejects.toThrow(
      'Request failed with status code 404',
    );
  });

  it('should handle network errors', async () => {
    // Simulate a network error (no response)
    const mockError = {
      request: {},
      isAxiosError: true,
      message: 'Network Error',
    };

    mockAxiosInstance.request.mockRejectedValue(mockError);

    await expect(httpClient.get('/users/1')).rejects.toThrow('No response received from server');
  });

  it('should handle setup errors', async () => {
    // Simulate a setup error (no request)
    const mockError = {
      isAxiosError: true,
      message: 'Config Error',
    };

    mockAxiosInstance.request.mockRejectedValue(mockError);

    await expect(httpClient.get('/users/1')).rejects.toThrow('Config Error');
  });
});
