import axios, { type AxiosInstance } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, createApiClient } from '../src/apiClient';
import type {
  ApiEndpoint,
  ErrorInterceptor,
  RequestInterceptor,
  ResponseInterceptor,
} from '../src/types';

// Mock axios
vi.mock('axios', () => {
  const mockInterceptors = {
    request: {
      use: vi.fn(() => {
        // Store the function reference for testing
        mockInterceptors.request.handlers = mockInterceptors.request.handlers || [];
        mockInterceptors.request.handlers.push();
        return 1;
      }),
      eject: vi.fn(),
      handlers: [], // Store handlers for testing
    },
    response: {
      use: vi.fn(() => 2),
      eject: vi.fn(),
    },
  };

  const mockAxiosInstance = {
    interceptors: mockInterceptors,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      defaults: {
        headers: {
          common: {},
        },
      },
    },
    create: vi.fn(() => mockAxiosInstance),
  };
});

// Mock API endpoint
class MockPetApi implements ApiEndpoint {
  private axios;

  constructor(axiosInstance?) {
    this.axios = axiosInstance || axios.create();
  }
  [methodName: string]: (...args: unknown[]) => Promise<unknown>;

  setAxiosInstance(axiosInstance) {
    this.axios = axiosInstance;
  }

  getPets = vi.fn().mockImplementation(() => {
    return this.axios.get('/pets');
  });

  addPet = vi.fn().mockImplementation((pet) => {
    return this.axios.post('/pets', pet);
  });

  getPetById = vi.fn().mockImplementation((id: string) => {
    return this.axios.get(`/pets/${id}`);
  });
}

// Mock API endpoint without setAxiosInstance method
class MockUserApi implements ApiEndpoint {
  constructor(private axiosInstance?) {}
  [methodName: string]: (...args: unknown[]) => Promise<unknown>;

  request = vi.fn().mockImplementation((config) => {
    return this.axiosInstance ? this.axiosInstance.request(config) : axios.request(config);
  });

  getUsers = vi.fn().mockImplementation(() => {
    return this.request({ url: '/users', method: 'GET' });
  });

  getUserById = vi.fn().mockImplementation((id: string) => {
    return this.request({ url: `/users/${id}`, method: 'GET' });
  });
}

describe('ApiClient', () => {
  let mockAxiosInstance: AxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = axios.create();
    vi.clearAllMocks();

    // Clear stored handlers
    // if (mockAxiosInstance.interceptors.request.handlers) {
    // mockAxiosInstance.interceptors.request.handlers = [];
    // }
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create an API client with endpoints', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      { baseUrl: 'https://api.example.com' },
    );

    expect(client.api.pets).toBeDefined();
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.example.com',
      }),
    );
  });

  it('should allow reconfiguring the client', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      { baseUrl: 'https://api.example.com' },
    );

    client.configure({ baseUrl: 'https://api2.example.com' });

    expect(axios.create).toHaveBeenCalledTimes(2);
    expect(axios.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        baseURL: 'https://api2.example.com',
      }),
    );
  });

  it('should create a proxied client with createApiClient', () => {
    const client = createApiClient(
      {
        pets: MockPetApi,
      },
      'https://api.example.com',
    );

    expect(client.pets).toBeDefined();
    expect(client.configure).toBeDefined();
    expect(client.getBaseUrl).toBeDefined();
    expect(client.getHttpClient).toBeDefined();
    expect(client.addRequestInterceptor).toBeDefined();
    expect(client.addResponseInterceptor).toBeDefined();
    expect(client.addErrorInterceptor).toBeDefined();
  });

  it('should add request interceptors', () => {
    const client = new ApiClient({
      pets: MockPetApi,
    });

    const interceptor: RequestInterceptor = (config) => {
      config.headers.Authorization = 'Bearer test-token';
      return config;
    };

    client.addRequestInterceptor(interceptor);

    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
  });

  it('should add response interceptors', () => {
    const client = new ApiClient({
      pets: MockPetApi,
    });

    const interceptor: ResponseInterceptor = (response) => {
      response.data = { ...response.data, modified: true };
      return response;
    };

    client.addResponseInterceptor(interceptor);

    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it('should add error interceptors', () => {
    const client = new ApiClient({
      pets: MockPetApi,
    });

    const errorInterceptor: ErrorInterceptor = (error) => {
      console.error('API Error:', error);
      return Promise.reject(error);
    };

    client.addErrorInterceptor(errorInterceptor);

    // Error interceptors are applied when setting up request/response interceptors
    expect(client.options.errorInterceptors?.length).toBe(1);
  });

  it('should set up auth interceptor when auth is provided', () => {
    new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        auth: 'test-token',
      },
    );

    // Auth interceptor is added during initialization
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
  });

  it('should handle function-based auth tokens', async () => {
    const authFn = vi.fn().mockResolvedValue('dynamic-token');

    // Create client with auth function
    new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        auth: authFn,
      },
    );

    // Get the last request interceptor that was registered
    const handlers = mockAxiosInstance.interceptors.request.handlers;
    expect(handlers).toBeDefined();
    expect(handlers.length).toBeGreaterThan(0);

    // Get the last handler (should be our auth interceptor)
    const authInterceptor = handlers[handlers.length - 1];
    expect(authInterceptor).toBeDefined();

    // Test the interceptor
    const config = { headers: {} };
    await authInterceptor(config);

    expect(authFn).toHaveBeenCalled();
    expect(config.headers.Authorization).toBe('Bearer dynamic-token');
  });

  it('should proxy endpoint methods to use the current HTTP client', () => {
    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      { baseUrl: 'https://api.example.com' },
    );

    // Get the pets endpoint
    const petsApi = client.api.pets;

    // Call a method on the endpoint
    petsApi.getPets();

    // Verify the method was called
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/pets');

    // Reconfigure the client with a new baseUrl
    client.configure({ baseUrl: 'https://api2.example.com' });

    // Call the method again
    petsApi.getPets();

    // Verify the method was called with the new HTTP client
    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
  });

  it('should handle endpoints without setAxiosInstance method', () => {
    const client = new ApiClient(
      {
        users: MockUserApi,
      },
      { baseUrl: 'https://api.example.com' },
    );

    // Get the users endpoint
    const usersApi = client.api.users;

    // Call a method on the endpoint
    usersApi.getUsers();

    // Verify the request method was called
    expect(mockAxiosInstance.request).toHaveBeenCalledWith({
      url: '/users',
      method: 'GET',
    });

    // Reconfigure the client with a new baseUrl
    client.configure({ baseUrl: 'https://api2.example.com' });

    // Call the method again
    usersApi.getUsers();

    // Verify the request method was called with the new HTTP client
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(2);
  });

  it('should handle symbol properties in the proxy', () => {
    const client = createApiClient({
      pets: MockPetApi,
    });

    // Access a property using a symbol
    const symbolProp = Symbol('test');
    expect(client[symbolProp]).toBeUndefined();

    // This should not throw an error
    expect(() => client[symbolProp]).not.toThrow();
  });

  it('should preserve interceptors when reconfiguring unless explicitly overridden', () => {
    const requestInterceptor = vi.fn((config) => config);
    const responseInterceptor = vi.fn((response) => response);

    const client = new ApiClient(
      {
        pets: MockPetApi,
      },
      {
        baseUrl: 'https://api.example.com',
        requestInterceptors: [requestInterceptor],
        responseInterceptors: [responseInterceptor],
      },
    );

    // Verify interceptors were set up
    expect(client.options.requestInterceptors?.length).toBe(1);
    expect(client.options.responseInterceptors?.length).toBe(1);

    // Reconfigure with new baseUrl but no new interceptors
    client.configure({ baseUrl: 'https://api2.example.com' });

    // Verify interceptors were preserved
    expect(client.options.requestInterceptors?.length).toBe(1);
    expect(client.options.responseInterceptors?.length).toBe(1);

    // Reconfigure with new interceptors
    const newRequestInterceptor = vi.fn((config) => config);
    client.configure({
      requestInterceptors: [newRequestInterceptor],
    });

    // Verify only request interceptors were replaced
    expect(client.options.requestInterceptors?.length).toBe(1);
    expect(client.options.requestInterceptors?.[0]).toBe(newRequestInterceptor);
    expect(client.options.responseInterceptors?.length).toBe(1);
    expect(client.options.responseInterceptors?.[0]).toBe(responseInterceptor);
  });
});
