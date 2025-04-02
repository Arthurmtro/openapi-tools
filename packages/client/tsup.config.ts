import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/api/index.ts',
    'src/core/index.ts',
    'src/generator/index.ts',
    'src/utils/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  tsconfig: 'tsconfig.build.json',
  splitting: true,
  clean: true,
  treeshake: true,
  // Do not bundle @arthurmtro/openapi-tools-common as an external dependency
  external: [],
  // Do include @arthurmtro/openapi-tools-common in the bundle
  noExternal: ['@arthurmtro/openapi-tools-common'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
