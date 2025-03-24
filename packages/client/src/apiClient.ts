import axios, { type AxiosInstance } from 'axios';
import type { ApiClientOptions, ApiEndpointConstructor, ApiEndpoints } from './types';

export class ApiClient<T extends ApiEndpoints> {
  private http: AxiosInstance;
  private endpoints: T;
  private options: ApiClientOptions;

  constructor(endpoints: T, options: ApiClientOptions = {}) {
    this.options = options;
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(endpoints);
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout || 30000,
      headers: this.options.headers || {},
      withCredentials: this.options.withCredentials,
    });
  }

  private initializeEndpoints(endpoints: T): T {
    const initialized = {} as T;

    for (const [key, EndpointClass] of Object.entries(endpoints)) {
      if (typeof EndpointClass === 'function') {
        // Use type assertion to tell TypeScript that this is safe
        initialized[key as keyof T] = new (EndpointClass as ApiEndpointConstructor)(
          undefined,
          this.options.baseUrl,
          this.http
        ) as T[keyof T];
      } else {
        initialized[key as keyof T] = EndpointClass as T[keyof T];
      }
    }

    return initialized;
  }

  public configure(options: ApiClientOptions): void {
    Object.assign(this.options, options);
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(this.endpoints);
  }

  public get api(): T {
    return this.endpoints;
  }

  public static createClient<T extends ApiEndpoints>(
    endpoints: T,
    options: ApiClientOptions = {}
  ): T {
    const client = new ApiClient(endpoints, options);

    return new Proxy({} as T, {
      get: (_, prop) => {
        const key = prop as keyof T;
        if (key in client.api) {
          return client.api[key];
        }
        throw new Error(`API endpoint "${String(prop)}" not found`);
      },
    });
  }
}
