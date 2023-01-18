import { build } from "esbuild"

build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outdir: "out",
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
