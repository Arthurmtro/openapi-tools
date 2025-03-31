import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,integration}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 30000, // Integration tests may take longer
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
