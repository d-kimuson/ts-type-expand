import { build } from "esbuild"
import { resolve } from "path"

build({
  entryPoints: [resolve(__dirname, "../src/index.ts")],
  bundle: true,
  outdir: resolve(__dirname, "../dist"),
  platform: "node",
  format: "cjs",
  sourcemap: true,
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
