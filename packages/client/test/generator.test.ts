// test/generator.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { generateClient } from '../src/generator';

describe('Client Generator', () => {
  const TEST_OUTPUT_DIR = path.join(__dirname, 'output');
  const TEST_SPEC_PATH = path.join(__dirname, 'fixtures', 'petstore.json');

  beforeEach(() => {
    // Ensure test output directory exists
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test output
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  it('generates a client successfully', async () => {
    await generateClient({
      specPath: TEST_SPEC_PATH,
      outputDir: TEST_OUTPUT_DIR,
    });

    // Verify output files exist
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'client.ts'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, 'generated'))).toBe(true);
  });

  // Add more specific tests for edge cases
});
