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
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
