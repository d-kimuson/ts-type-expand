import { build } from "esbuild"

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "cjs",
  minify: true,
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
