import { createApiClient } from './generated/client';

// Note: After running the generate-client script, this import will work
// For now, provide a fallback to prevent TypeScript errors
let API_CLIENTS: Record<string, any> = {};
try {
  // This will be available after code generation
  API_CLIENTS = require('./generated/client').API_CLIENTS;
} catch (error) {
  console.warn('API clients not yet generated, using empty object');
  API_CLIENTS = {};
}

// Create API client instance
export const api = createApiClient(API_CLIENTS, 'https://petstore.swagger.io/v2', {
  httpClientType: 'fetch'
});

// Add request logging interceptor
api.addRequestInterceptor((config) => {
  console.log(`API Request: ${config.method} ${config.url}`);
  return config;
});

// Add response logging interceptor
api.addResponseInterceptor((response) => {
  console.log(`API Response: ${response.status} from ${response.config.url}`);
  return response;
});

// Add error handling interceptor
api.addErrorInterceptor((error: any) => {
  console.error('API Error:', error?.status, error?.message);
  return Promise.reject(error);
});

export default api;