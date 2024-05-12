import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  clean: true,
  sourcemap: "inline",
  target: "node16",
  format: ["cjs"],
  tsconfig: "tsconfig.json",
  external: ["typescript"],
  minify: true,
});
