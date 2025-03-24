export interface OpenAPIConfig {
  specPath: string;
  outputDir: string;
  format?: 'json' | 'yaml';
}

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}
