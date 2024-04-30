import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["./src/extension.ts"],
  dts: false,
  sourcemap: "inline",
  target: "node18",
  format: ["cjs"],
  clean: true,
  tsconfig: "tsconfig.json",
  external: ["vscode"],
})
