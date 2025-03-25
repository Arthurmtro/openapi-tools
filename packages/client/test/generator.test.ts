// test/generator.test.ts
import { describe, it, expect, beforeEach, afterEach, vi, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { generateClient } from '../src/generator';

// Mock child_process.spawn
vi.mock('node:child_process', () => ({
  spawn: vi.fn((command, args, options) => {
    const EventEmitter = require('node:events');
    const emitter = new EventEmitter();
    
    // Mock stdout and stderr
    emitter.stdout = new EventEmitter();
    emitter.stderr = new EventEmitter();
    
    // Simulate successful completion
    setTimeout(() => {
      emitter.emit('close', 0);
    }, 10);
    
    return emitter;
  })
}));

// Mock js-yaml
vi.mock('js-yaml', () => ({
  load: vi.fn((content) => ({ 
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: { '/test': { get: { operationId: 'getTest' } } }
  }))
}));

/**
 * Recursively removes a directory and all its contents
 */
async function removeDirectory(dirPath: string): Promise<void> {
  try {
    // Check if directory exists
    await fs.promises.access(dirPath);
    
    // Get all files and subdirectories
    const items = await fs.promises.readdir(dirPath);
    
    // Process each item
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.promises.stat(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively remove subdirectory
        await removeDirectory(itemPath);
      } else {
        // Remove file
        await fs.promises.unlink(itemPath);
      }
    }
    
    // Remove the empty directory
    await fs.promises.rmdir(dirPath);
  } catch (error) {
    // Ignore if directory doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

describe('Client Generator', () => {
  const TEST_OUTPUT_DIR = path.join(__dirname, 'output');
  const TEST_SPEC_PATH = path.join(__dirname, '__fixtures__', 'petstore.json');
  const GENERATED_APIS_DIR = path.join(TEST_OUTPUT_DIR, 'generated', 'apis');

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fs.promises.readdir specifically for the generated/apis directory
    vi.spyOn(fs.promises, 'readdir').mockImplementation((dirPath) => {
      const pathStr = dirPath.toString();
      
      // If this is the APIs directory we're looking for
      if (pathStr.includes('generated/apis') || pathStr.includes('generated\\apis')) {
        return Promise.resolve(['default-api.ts', 'pet-api.ts', 'store-api.ts', 'user-api.ts']);
      }
      
      // For other directories, return empty array
      return Promise.resolve([]);
    });
    
    // Mock fs.promises.readFile
    vi.spyOn(fs.promises, 'readFile').mockImplementation((filePath) => {
      const pathStr = filePath.toString();
      
      if (pathStr.includes('petstore.json')) {
        return Promise.resolve(JSON.stringify({
          openapi: '3.0.0',
          info: { title: 'Pet Store API', version: '1.0.0' },
          paths: { '/pets': { get: { operationId: 'getPets' } } }
        }));
      } else if (pathStr.includes('petstore.yaml')) {
        return Promise.resolve('openapi: 3.0.0\ninfo:\n  title: Pet Store API\n  version: 1.0.0');
      }
      
      return Promise.resolve('');
    });
    
    // Mock fs.promises.mkdir
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    
    // Mock fs.promises.writeFile
    vi.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    
    // Don't mock these methods to allow real cleanup
    vi.spyOn(fs.promises, 'access').mockImplementation(async (path) => {
      // For the test output directory, pretend it exists
      if (path.toString().includes('output')) {
        return Promise.resolve();
      }
      // For other paths, use the real implementation
      return vi.importActual('node:fs').promises.access(path);
    });
    
    // For stat, unlink, and rmdir, use real implementations for cleanup
    vi.spyOn(fs.promises, 'stat').mockImplementation(async (path) => {
      // Create a mock stat object for test paths
      if (path.toString().includes('output')) {
        return Promise.resolve({
          isDirectory: () => path.toString().includes('output'),
          isFile: () => !path.toString().includes('output')
        } as fs.Stats);
      }
      // For other paths, use the real implementation
      return vi.importActual('node:fs').promises.stat(path);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  // Clean up the output directory after all tests
  afterAll(async () => {
    // Restore all mocks to ensure real fs operations
    vi.restoreAllMocks();
    
    try {
      // Check if the output directory exists in the real file system
      await fs.promises.access(TEST_OUTPUT_DIR);
      
      // If it exists, remove it
      console.log(`Cleaning up test output directory: ${TEST_OUTPUT_DIR}`);
      await removeDirectory(TEST_OUTPUT_DIR);
      console.log('Cleanup completed successfully');
    } catch (error) {
      // Ignore if directory doesn't exist
      if (error.code !== 'ENOENT') {
        console.error('Error during cleanup:', error);
      }
    }
  });

  it('generates a client successfully', async () => {
    await generateClient({
      specPath: TEST_SPEC_PATH,
      outputDir: TEST_OUTPUT_DIR,
    });

    // Verify fs operations were called
    expect(fs.promises.mkdir).toHaveBeenCalled();
    expect(fs.promises.readFile).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalled();
    expect(fs.promises.readdir).toHaveBeenCalled();
  });
});
