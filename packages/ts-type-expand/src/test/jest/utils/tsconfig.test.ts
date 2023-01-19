import path from "path"
import { ModuleKind, ScriptTarget } from "typescript"
import { loadTsConfig } from "~/utils/tsconfig"

const exampleDir = path.resolve(__dirname, "../../../../../example")

test("load example tsconfig", () => {
  const tsConfig = loadTsConfig(
    path.resolve(exampleDir, "tsconfig.json"),
    exampleDir
  )
  expect(tsConfig.options.module).toBe(ModuleKind.CommonJS)
  expect(tsConfig.options.target).toBe(ScriptTarget.ES2020)
})
