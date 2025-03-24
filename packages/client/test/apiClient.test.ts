import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ApiClient, createApiClient } from '../src/apiClient';
import type { ApiEndpoint, RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from '../src/types';

// Mock axios
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxiosInstance),
    defaults: {
      headers: {
        common: {}
      }
    }
  };
  
  const mockInterceptors = {
    request: {
      use: vi.fn(() => 1),
      eject: vi.fn()
    },
    response: {
      use: vi.fn(() => 2),
      eject: vi.fn()
    }
  };
  
  const mockAxiosInstance = {
    interceptors: mockInterceptors,
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn()
  };
  
  return mockAxios;
});

// Mock API endpoint
class MockPetApi implements ApiEndpoint {
  constructor(private axiosInstance: any) {}
  
  getPets = vi.fn().mockResolvedValue({ data: ['pet1', 'pet2'] });
  addPet = vi.fn().mockResolvedValue({ data: { id: 1, name: 'fluffy' } });
}

describe('ApiClient', () => {
  let mockAxiosInstance: any;
  
  beforeEach(() => {
    mockAxiosInstance = axios.create();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create an API client with endpoints', () => {
    const client = new ApiClient({
      pets: MockPetApi
    }, { baseUrl: 'https://api.example.com' });
    
    expect(client.api.pets).toBeDefined();
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: 'https://api.example.com'
    }));
  });
  
  it('should allow reconfiguring the client', () => {
    const client = new ApiClient({
      pets: MockPetApi
    }, { baseUrl: 'https://api.example.com' });
    
    client.configure({ baseUrl: 'https://api2.example.com' });
    
    expect(axios.create).toHaveBeenCalledTimes(2);
    expect(axios.create).toHaveBeenLastCalledWith(expect.objectContaining({
      baseURL: 'https://api2.example.com'
    }));
  });
  
  it('should create a proxied client with createApiClient', () => {
    const client = createApiClient({
      pets: MockPetApi
    }, 'https://api.example.com');
    
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
      pets: MockPetApi
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
      pets: MockPetApi
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
      pets: MockPetApi
    });
    
    const errorInterceptor: ErrorInterceptor = (error) => {
      console.error('API Error:', error);
      return Promise.reject(error);
    };
    
    client.addErrorInterceptor(errorInterceptor);
    
    // Error interceptors are applied when setting up request/response interceptors
    expect(client['options'].errorInterceptors?.length).toBe(1);
  });
  
  it('should set up auth interceptor when auth is provided', () => {
    new ApiClient({
      pets: MockPetApi
    }, {
      auth: 'test-token'
    });
    
    // Auth interceptor is added during initialization
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
  });
});
