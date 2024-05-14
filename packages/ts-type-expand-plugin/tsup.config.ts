import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server/index.ts'],
  dts: true,
  sourcemap: 'inline',
  target: 'node16',
  format: ['cjs'],
  tsconfig: 'tsconfig.json',
  external: ['typescript'],
  clean: false,
  minify: false,
})
