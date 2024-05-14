import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/extension.ts'],
  dts: false, // 他から参照されないので不要
  sourcemap: 'inline',
  target: 'node16',
  format: ['cjs'],
  tsconfig: 'tsconfig.json',
  external: ['vscode'],
  outDir: 'dist',
  clean: false,
  minify: false,
})
