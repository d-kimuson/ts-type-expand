// @ts-check
import { build, context } from "esbuild"

/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "cjs",
  minify: true,
}

if (process.env.IS_WATCH === "true") {
  const ctx = await context(config)
  await ctx.watch()
} else {
  await build(config)
}
