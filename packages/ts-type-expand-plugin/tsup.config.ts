import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/server/index.ts"],
  dts: true,
  sourcemap: "inline",
  target: "node16",
  format: ["cjs"],
  clean: true,
  tsconfig: "tsconfig.json",
  external: ["typescript"],
  minify: true,
});
