import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { GeneratorOptions } from './types';
import { formatName } from '@openapi-tools/common';

export class ClientGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = {
      ...options,
      format: options.format || this.detectFormat(options.specPath),
      options: {
        namingConvention: options.options?.namingConvention || 'camelCase',
        httpClient: options.options?.httpClient || 'axios',
        ...options.options,
      },
    };
  }

  /**
   * Determines the format of the OpenAPI specification file based on its extension
   */
  private detectFormat(specPath: string): 'json' | 'yaml' {
    const ext = path.extname(specPath).toLowerCase();
    if (ext === '.json') return 'json';
    if (ext === '.yaml' || ext === '.yml') return 'yaml';

    return 'json';
  }

  /**
   * Reads and parses the OpenAPI specification file
   */
  private async parseSpec(): Promise<Record<string, unknown>> {
    // For large files, consider using streaming for JSON parsing
    // For yaml files, we still need to read the whole file due to js-yaml limitations
    if (this.options.format === 'json' && fs.statSync(this.options.specPath).size > 10_000_000) {
      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(this.options.specPath, { encoding: 'utf8' });
        let data = '';

        stream.on('data', (chunk) => {
          data += chunk;
        });
        stream.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(
              new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`)
            );
          }
        });
        stream.on('error', reject);
      });
    }

    // Default implementation for smaller files
    const content = await fs.promises.readFile(this.options.specPath, 'utf8');

    if (this.options.format === 'yaml') {
      const { load } = await import('js-yaml');
      return load(content) as Record<string, unknown>;
    }

    return JSON.parse(content);
  }

  /**
   * Runs the OpenAPI Generator CLI to generate the base TypeScript client
   */
  private async runOpenApiGenerator(): Promise<string> {
    const outputDir = path.join(this.options.outputDir, 'generated');

    await fs.promises.mkdir(outputDir, { recursive: true });

    return new Promise<string>((resolve, reject) => {
      const args = [
        '@openapitools/openapi-generator-cli',
        'generate',
        '-i',
        this.options.specPath,
        '-g',
        'typescript-axios',
        '-o',
        outputDir,
        '--additional-properties=withSeparateModelsAndApi=true,modelPackage=models,apiPackage=apis',
      ];

      console.log(`Running OpenAPI generator: npx ${args.join(' ')}`);

      const generator = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'] });

      let stderr = '';
      // let stdout = '';

      // generator.stdout.on('data', (data) => {
      // stdout += data.toString();
      // });

      generator.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      generator.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`OpenAPI Generator failed with code ${code}:\n${stderr}`));
        } else {
          console.log('OpenAPI Generator completed successfully');
          resolve(outputDir);
        }
      });

      generator.on('error', (err) => {
        reject(new Error(`Failed to run OpenAPI Generator: ${err.message}`));
      });
    });
  }

  /**
   * Identifies API groups from the generated files and formats their names
   * according to the specified naming convention
   */
  private async identifyApiGroups(
    generatedDir: string
  ): Promise<Array<{ originalName: string; formattedName: string }>> {
    const apisDir = path.join(generatedDir, 'apis');
    const files = await fs.promises.readdir(apisDir);

    return files
      .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
      .map((file) => {
        // Extract the API name from the file name (e.g., 'default-api.ts' -> 'default')
        const baseName = path.basename(file, '.ts').replace(/-api$|Api$/, '');

        // Generate the formatted name for usage in the API
        const formattedName = formatName(
          baseName,
          this.options.options?.namingConvention as 'camelCase' | 'PascalCase' | 'kebab-case'
        );

        return {
          originalName: baseName,
          formattedName,
        };
      });
  }

  /**
   * Generates the proxified client wrapper
   */
  private async generateProxifiedClient(
    generatedDir: string,
    apiGroups: Array<{ originalName: string; formattedName: string }>
  ): Promise<void> {
    // Generate primary client file with proxy implementation
    const clientFilePath = path.join(this.options.outputDir, 'client.ts');
    const clientContent = this.generateProxifiedClientContent(generatedDir, apiGroups);
    await fs.promises.writeFile(clientFilePath, clientContent);

    // Generate index file for easy imports
    const indexFilePath = path.join(this.options.outputDir, 'index.ts');
    const indexContent = `export * from './client';\nexport * from './generated/apis';\nexport * from './generated/models';\n`;
    await fs.promises.writeFile(indexFilePath, indexContent);
  }

  /**
   * Generates the content for the proxified client.ts file
   */
  private generateProxifiedClientContent(
    generatedDir: string,
    apiGroups: Array<{ originalName: string; formattedName: string }>
  ): string {
    // Calculate relative path to generated code
    const relativeGeneratedPath = path
      .relative(path.dirname(path.join(this.options.outputDir, 'client.ts')), generatedDir)
      .replace(/\\/g, '/');

    // Ensure path starts with ./ or ../ for proper module resolution
    const importPath = relativeGeneratedPath.startsWith('.')
      ? relativeGeneratedPath
      : `./${relativeGeneratedPath}`;

    // Create imports for all API classes
    const imports = apiGroups
      .map((group) => {
        // Handle special case for default-api.ts which becomes DefaultApi class
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `import { ${className} } from '${importPath}/apis/${group.originalName}-api';`;
      })
      .join('\n');

    // Create individual exports instead of re-exporting everything
    const apiExports = apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `export { ${className} } from '${importPath}/apis/${group.originalName}-api';`;
      })
      .join('\n');

    // Create model exports, if models exist
    const modelExportsContent = `export * from '${importPath}/models';`;

    // Create API_CLIENTS object entries
    const apiClientsEntries = apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `  ${group.formattedName}: ${className},`;
      })
      .join('\n');

    // Create ApiEndpoints type properties
    const apiEndpointsProps = apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `  ${group.formattedName}: InstanceType<typeof ${className}>;`;
      })
      .join('\n');

    // Generate the full client content with proper imports
    return `/**
 * GENERATED CODE - DO NOT MODIFY
 * Generated by openapi-typed-client
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
// Import the Configuration class as a value since we need to instantiate it
import { Configuration } from '${importPath}/configuration';
${imports}

// Re-export API classes individually
${apiExports}

// Re-export models
${modelExportsContent}

// API client configuration options
export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  auth?: string | (() => string | Promise<string>);
}

// Group API classes for initialization
export const API_CLIENTS = {
${apiClientsEntries}
};

// Define the type for all API endpoints
export type ApiEndpoints = {
${apiEndpointsProps}
};

// Define the client methods we want to expose through the proxy
export interface ApiClientMethods {
  configure: (options: ApiClientOptions) => void;
  getBaseUrl: () => string | undefined;
  getHttpClient: () => AxiosInstance;
}

/**
 * Enhanced API client that provides proxied access to API endpoints
 */
export class ApiClient<T extends ApiEndpoints> {
  private http: AxiosInstance;
  private endpoints: T;
  private options: ApiClientOptions;

  constructor(endpoints: Record<string, unknown>, options: ApiClientOptions = {}) {
    this.options = options;
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(endpoints) as T;
  }

  private createHttpClient(): AxiosInstance {
    return axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout || 30000,
      headers: this.options.headers || {},
      withCredentials: this.options.withCredentials
    });
  }

  private initializeEndpoints(endpoints: Record<string, unknown>): Record<string, unknown> {
    const initialized: Record<string, unknown> = {};

    for (const [key, EndpointClass] of Object.entries(endpoints)) {
      if (typeof EndpointClass === 'function') {
        initialized[key] = new (EndpointClass as any)(
          new Configuration(),
          this.options.baseUrl,
          this.http
        );
      } else {
        initialized[key] = EndpointClass;
      }
    }

    return initialized;
  }

  public configure(options: ApiClientOptions): void {
    Object.assign(this.options, options);
    this.http = this.createHttpClient();
    this.endpoints = this.initializeEndpoints(this.endpoints) as T;
  }

  public getBaseUrl(): string | undefined {
    return this.options.baseUrl;
  }

  public getHttpClient(): AxiosInstance {
    return this.http;
  }

  public get api(): T {
    return this.endpoints;
  }

/**
 * Creates a proxied client for direct access to API endpoints and client methods
 */
  public static createClient<T extends ApiEndpoints>(
      endpoints: Record<string, unknown>,
      options: ApiClientOptions = {}
    ): T & ApiClientMethods {
    const client = new ApiClient<T>(endpoints as T, options);

    // Create a proxy that handles both API endpoints and client methods
    return new Proxy(Object.create(null) as T & ApiClientMethods, {
      get: (_, prop) => {
        // Handle client methods
        if (prop === 'configure') {
          return (newOptions: ApiClientOptions) => client.configure(newOptions);
        }
        if (prop === 'getBaseUrl') {
          return () => client.getBaseUrl();
        }
        if (prop === 'getHttpClient') {
          return () => client.getHttpClient();
        }

        // Handle API endpoints
        const key = prop as keyof T;
        if (key in client.api) {
          return client.api[key];
        }

        return undefined;
      }
    });
  }
}

/**
 * Create a typed API client instance
 * @param baseUrl - Base URL for API requests
 * @param options - Additional client options
 * @returns Typed API client with configure method
 */
export const createApiClient = (baseUrl = '', options = {}): ApiEndpoints & ApiClientMethods => {
  return ApiClient.createClient<ApiEndpoints>(API_CLIENTS, {
    baseUrl,
    ...options
  });
};

// Create a default client instance
export const api = createApiClient();
`;
  }

  /**
   * Creates an index.ts file in the apis directory to re-export all API classes
   */
  private async createApisIndexFile(
    generatedDir: string,
    apiGroups: Array<{ originalName: string; formattedName: string }>
  ): Promise<void> {
    const apisDir = path.join(generatedDir, 'apis');
    const indexPath = path.join(apisDir, 'index.ts');

    // Generate content that re-exports each API
    const content = apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `export { ${className} } from './${group.originalName}-api';`;
      })
      .join('\n');

    // Write the index file
    await fs.promises.writeFile(indexPath, content);
  }

  /**
   * Main method that orchestrates the entire generation process
   */
  public async generate(): Promise<void> {
    try {
      console.log('Starting API client generation...');

      // Step 1: Parse the OpenAPI specification
      await this.parseSpec();
      console.log('OpenAPI specification parsed successfully');

      // Step 2: Generate the base TypeScript client
      const generatedDir = await this.runOpenApiGenerator();
      console.log('Base client generated successfully');

      // Step 3: Identify API groups from the generated files
      const apiGroups = await this.identifyApiGroups(generatedDir);
      console.log(
        `Identified ${apiGroups.length} API groups:`,
        apiGroups.map((g) => `${g.originalName} → ${g.formattedName}`).join(', ')
      );

      // Step 4: Create an index.ts file in the apis directory
      await this.createApisIndexFile(generatedDir, apiGroups);
      console.log('APIs index file created successfully');

      // Step 5: Generate the proxified wrapper client
      await this.generateProxifiedClient(generatedDir, apiGroups);
      console.log('Proxified client generated successfully');

      console.log('API client generation completed successfully!');
    } catch (error) {
      console.error('Error generating API client:', error);
      throw error;
    }
  }
}

export async function generateClient(options: GeneratorOptions): Promise<void> {
  const generator = new ClientGenerator(options);
  await generator.generate();
}
