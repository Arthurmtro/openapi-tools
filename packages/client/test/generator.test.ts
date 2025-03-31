import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ClientGenerator } from '../src/generator/generator';

// We'll skip complex mocks and just test the constructor options
describe('ClientGenerator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  // Create a minimal subclass to avoid actual file operations
  class TestGenerator extends ClientGenerator {
    constructor(options: any) {
      super(options);
    }
    
    // Expose the options for testing
    getOptions() {
      return (this as any).options;
    }
    
    // Override methods that would attempt to do filesystem operations
    async generate(): Promise<void> {
      // Don't actually generate anything
      return Promise.resolve();
    }
  }
  
  it('should default to fetch http client for minimal dependencies', () => {
    const generator = new TestGenerator({
      specPath: '/path/to/spec.json',
      outputDir: '/path/to/output',
    });
    
    expect(generator.getOptions().options.httpClient).toBe('fetch');
  });
  
  it('should use axios if explicitly specified', () => {
    const generator = new TestGenerator({
      specPath: '/path/to/spec.json',
      outputDir: '/path/to/output',
      options: {
        httpClient: 'axios',
      },
    });
    
    expect(generator.getOptions().options.httpClient).toBe('axios');
  });
  
  it('should preserve other options', () => {
    const generator = new TestGenerator({
      specPath: '/path/to/spec.json',
      outputDir: '/path/to/output',
      format: 'json',
      options: {
        namingConvention: 'kebab-case',
        httpClient: 'axios',
      },
    });
    
    const options = generator.getOptions();
    expect(options.specPath).toBe('/path/to/spec.json');
    expect(options.outputDir).toBe('/path/to/output');
    expect(options.format).toBe('json');
    expect(options.options.namingConvention).toBe('kebab-case');
    expect(options.options.httpClient).toBe('axios');
  });
});