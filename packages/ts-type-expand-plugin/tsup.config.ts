import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  sourcemap: "inline",
  target: "node18",
  format: ["cjs"],
  clean: true,
  tsconfig: "tsconfig.json",
  external: ["typescript"],
})
