import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  clean: true,
  sourcemap: "inline",
  target: "esnext",
  format: ["cjs"],
  tsconfig: "tsconfig.json",
  external: ["typescript"],
})
