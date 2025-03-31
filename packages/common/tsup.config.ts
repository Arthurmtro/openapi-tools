import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/http/index.ts',
    'src/http/utils/index.ts',
    'src/http/utils/cache/index.ts',
    'src/http/utils/batch/index.ts',
    'src/http/utils/throttle/index.ts',
    'src/http/utils/retry/index.ts',
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
