import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultHttpClient } from '../src/http';
import type { HttpClient, HttpResponse, RequestOptions } from '../src/http/types';
import { createError } from '../src/utils';

// Mock fetch for testing
const mockFetchResponse = (status = 200, data = {}, headers = {}) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      forEach: (callback: (value: string, key: string) => void) => {
        for (const [key, value] of Object.entries(headers)) {
          callback(value as string, key);
        }
      },
      get: (key: string) => headers[key as keyof typeof headers] || null,
    },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.reject(new Error('Not implemented in tests')),
    arrayBuffer: () => Promise.reject(new Error('Not implemented in tests')),
  };
};

// Setup global fetch mock
const originalFetch = globalThis.fetch;

describe('HttpClient - Fetch Implementation', () => {
  let httpClient: HttpClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup fetch mock
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    // Create a fresh client for each test
    httpClient = createDefaultHttpClient({
      baseUrl: 'https://api.example.com',
      timeout: 1000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('should make a basic GET request correctly', async () => {
    const mockData = { name: 'Test User' };
    fetchMock.mockResolvedValueOnce(mockFetchResponse(200, mockData));

    const response = await httpClient.get('/users/1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual(mockData);
  });

  it('should make a POST request with data', async () => {
    const mockData = { id: 1, name: 'New User' };
    const requestData = { name: 'New User' };
    fetchMock.mockResolvedValueOnce(mockFetchResponse(201, mockData));

    const response = await httpClient.post('/users', requestData);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(requestData),
      }),
    );

    expect(response.status).toBe(201);
    expect(response.data).toEqual(mockData);
  });

  it('should handle request errors correctly', async () => {
    const errorData = { message: 'Resource not found' };
    fetchMock.mockResolvedValueOnce(mockFetchResponse(404, errorData));

    await expect(httpClient.get('/users/999')).rejects.toThrow();
  });

  it('should support request interceptors', async () => {
    const mockData = { name: 'Test User' };
    fetchMock.mockResolvedValueOnce(mockFetchResponse(200, mockData));

    // Add a request interceptor
    const interceptor = vi.fn((config: RequestOptions): RequestOptions => {
      return {
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'custom-value',
        },
      };
    });

    httpClient.addRequestInterceptor(interceptor);

    await httpClient.get('/users/1');

    expect(interceptor).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users/1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-Header': 'custom-value',
        }),
      }),
    );
  });

  it('should support response interceptors', async () => {
    const mockData = { name: 'Test User' };
    fetchMock.mockResolvedValueOnce(mockFetchResponse(200, mockData));

    // Add a response interceptor
    const interceptor = vi.fn((response: HttpResponse): HttpResponse => {
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
    });

    httpClient.addResponseInterceptor(interceptor);

    const response = await httpClient.get('/users/1');

    expect(interceptor).toHaveBeenCalled();
    expect(response.data).toEqual({ ...mockData, intercepted: true });
  });

  it('should handle request timeouts', async () => {
    // Create a promise that never resolves to simulate timeout
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((_resolve) => {
          // This promise never resolves, causing the timeout to trigger
        }),
    );

    // Reduce timeout for test speed
    const clientWithShortTimeout = createDefaultHttpClient({
      timeout: 100, // short timeout for testing
    });

    await expect(clientWithShortTimeout.get('/users/1')).rejects.toThrow(/timeout/i);
  });

  it('should handle removing interceptors', async () => {
    const mockData = { name: 'Test User' };
    fetchMock.mockResolvedValueOnce(mockFetchResponse(200, mockData));
    fetchMock.mockResolvedValueOnce(mockFetchResponse(200, mockData));

    // Add a request interceptor
    const interceptor = vi.fn((config: RequestOptions): RequestOptions => {
      return {
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'custom-value',
        },
      };
    });

    const id = httpClient.addRequestInterceptor(interceptor);

    // Make a request with the interceptor
    await httpClient.get('/users/1');
    expect(interceptor).toHaveBeenCalledTimes(1);

    // Remove the interceptor
    httpClient.removeInterceptor(id);

    // Reset the mock
    interceptor.mockClear();

    // Make another request
    await httpClient.get('/users/1');

    // Interceptor should not have been called
    expect(interceptor).not.toHaveBeenCalled();
  });

  it('should add query parameters correctly', async () => {
    const mockData = [{ name: 'User 1' }, { name: 'User 2' }];
    fetchMock.mockResolvedValueOnce(mockFetchResponse(200, mockData));

    await httpClient.get('/users', {
      params: {
        page: '1',
        limit: '10',
        sort: 'name',
      },
    });

    // Check if the URL includes all parameters
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/users?page=1&limit=10&sort=name',
      expect.anything(),
    );
  });
});

describe('createError function', () => {
  it('should create an error with additional properties', () => {
    const message = 'Test error';
    const status = 404;
    const code = 'NOT_FOUND';
    const details = { resource: 'user', id: 123 };

    const error = createError(message, status, code, details);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.details).toEqual(details);
  });

  it('should work with just a message', () => {
    const message = 'Simple error';
    const error = createError(message);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
    expect(error.status).toBeUndefined();
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});
