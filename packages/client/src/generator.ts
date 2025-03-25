import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { formatName } from '@openapi-tools/common';
import {
  generateApisIndexTemplate,
  generateClientTemplate,
  generateIndexTemplate,
} from './templates';
import type { GeneratorOptions } from './types';

/**
 * Interface for OpenAPI specification object
 */
interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
  };
  paths?: Record<string, unknown>;
  components?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Interface for API group information
 */
interface ApiGroup {
  originalName: string;
  formattedName: string;
}

/**
 * Generates TypeScript client code from OpenAPI specifications
 */
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
    return ext === '.yaml' || ext === '.yml' ? 'yaml' : 'json';
  }

  /**
   * Reads and parses the OpenAPI specification file
   */
  private async parseSpec(): Promise<OpenAPISpec> {
    const content = await fs.promises.readFile(this.options.specPath, 'utf8');

    if (this.options.format === 'yaml') {
      const { load } = await import('js-yaml');
      return load(content) as OpenAPISpec;
    }

    return JSON.parse(content) as OpenAPISpec;
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
      generator.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      generator.on('close', (code: number | null) => {
        if (code !== 0) {
          reject(new Error(`OpenAPI Generator failed with code ${code}:\n${stderr}`));
        } else {
          console.log('OpenAPI Generator completed successfully');
          resolve(outputDir);
        }
      });

      generator.on('error', (err: Error) => {
        reject(new Error(`Failed to run OpenAPI Generator: ${err.message}`));
      });
    });
  }

  /**
   * Identifies API groups from the generated files and formats their names
   */
  private async identifyApiGroups(generatedDir: string): Promise<ApiGroup[]> {
    const apisDir = path.join(generatedDir, 'apis');
    const files = await fs.promises.readdir(apisDir);

    return files
      .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
      .map((file) => {
        const baseName = path.basename(file, '.ts').replace(/-api$|Api$/, '');
        const formattedName = formatName(
          baseName,
          this.options.options?.namingConvention as 'camelCase' | 'PascalCase' | 'kebab-case',
        );

        return {
          originalName: baseName,
          formattedName,
        };
      });
  }

  /**
   * Generates the client wrapper and index files
   */
  private async generateClientWrapper(generatedDir: string, apiGroups: ApiGroup[]): Promise<void> {
    // Calculate relative path to generated code
    const relativeGeneratedPath = path
      .relative(path.dirname(path.join(this.options.outputDir, 'client.ts')), generatedDir)
      .replace(/\\/g, '/');

    const importPath = relativeGeneratedPath.startsWith('.')
      ? relativeGeneratedPath
      : `./${relativeGeneratedPath}`;

    // Generate client file
    const clientFilePath = path.join(this.options.outputDir, 'client.ts');
    const clientContent = generateClientTemplate(
      importPath,
      this.generateImports(apiGroups, importPath),
      this.generateApiReExports(apiGroups, importPath),
      this.generateApiClientsEntries(apiGroups),
      this.generateApiEndpointsProps(apiGroups),
    );
    await fs.promises.writeFile(clientFilePath, clientContent);

    // Generate index file
    const indexFilePath = path.join(this.options.outputDir, 'index.ts');
    const indexContent = generateIndexTemplate();
    await fs.promises.writeFile(indexFilePath, indexContent);
  }

  /**
   * Creates imports for all API classes
   */
  private generateImports(apiGroups: ApiGroup[], importPath: string): string {
    return apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `import { ${className} } from '${importPath}/apis/${group.originalName}-api';`;
      })
      .join('\n');
  }

  /**
   * Creates API_CLIENTS object entries
   */
  private generateApiClientsEntries(apiGroups: ApiGroup[]): string {
    return apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `  ${group.formattedName}: ${className},`;
      })
      .join('\n');
  }

  /**
   * Creates ApiEndpoints type properties
   */
  private generateApiEndpointsProps(apiGroups: ApiGroup[]): string {
    return apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `  ${group.formattedName}: InstanceType<typeof ${className}>;`;
      })
      .join('\n');
  }

  /**
   * Creates API re-exports
   */
  private generateApiReExports(apiGroups: ApiGroup[], importPath: string): string {
    return apiGroups
      .map((group) => {
        const className = `${group.originalName.charAt(0).toUpperCase()}${group.originalName.slice(1)}Api`;
        return `export { ${className} } from '${importPath}/apis/${group.originalName}-api';`;
      })
      .join('\n');
  }

  /**
   * Creates an index.ts file in the apis directory to re-export all API classes
   */
  private async createApisIndexFile(generatedDir: string, apiGroups: ApiGroup[]): Promise<void> {
    const apisDir = path.join(generatedDir, 'apis');
    const indexPath = path.join(apisDir, 'index.ts');
    const content = generateApisIndexTemplate(apiGroups);
    await fs.promises.writeFile(indexPath, content);
  }

  /**
   * Main method that orchestrates the entire generation process
   */
  public async generate(): Promise<void> {
    try {
      console.log('Starting API client generation...');

      // Parse the OpenAPI specification
      await this.parseSpec();
      console.log('OpenAPI specification parsed successfully');

      // Generate the base TypeScript client
      const generatedDir = await this.runOpenApiGenerator();
      console.log('Base client generated successfully');

      // Identify API groups from the generated files
      const apiGroups = await this.identifyApiGroups(generatedDir);
      console.log(
        `Identified ${apiGroups.length} API groups:`,
        apiGroups.map((g) => `${g.originalName} → ${g.formattedName}`).join(', '),
      );

      // Create an index.ts file in the apis directory
      await this.createApisIndexFile(generatedDir, apiGroups);
      console.log('APIs index file created successfully');

      // Generate the client wrapper
      await this.generateClientWrapper(generatedDir, apiGroups);
      console.log('Client wrapper generated successfully');

      console.log('API client generation completed successfully!');
    } catch (error) {
      console.error('Error generating API client:', error);
      throw error;
    }
  }
}

/**
 * Generate a client from an OpenAPI specification
 */
export async function generateClient(options: GeneratorOptions): Promise<void> {
  const generator = new ClientGenerator(options);
  await generator.generate();
}
