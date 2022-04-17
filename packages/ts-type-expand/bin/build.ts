import { build } from "esbuild"
import { resolve } from "path"

build({
  entryPoints: [resolve(__dirname, "../src/extension.ts")],
  bundle: true,
  outdir: resolve(__dirname, "../out"),
  platform: "node",
  format: "cjs",
  sourcemap: true,
  external: ["vscode"],
  watch:
    process.env.IS_WATCH === "true"
      ? {
          onRebuild(error, result) {
            if (error) console.error("watch build failed:", error)
            else console.log("watch build succeeded:", result)
          },
        }
      : false,
})
