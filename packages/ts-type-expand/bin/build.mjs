// @ts-check
import { context, build } from "esbuild"

/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outdir: "out",
  platform: "node",
  format: "cjs",
  sourcemap: true,
  external: ["vscode"],
}

if (process.env.IS_WATCH === "true") {
  const ctx = await context(config)
  await ctx.watch()
} else {
  await build(config)
}
