import { ModuleKind, ScriptTarget } from "typescript"
import * as path from "path"

import { loadTsConfig } from "~/utils/tsConfig"

const exampleDir = path.resolve(__dirname, "../../example")

test("load example tsconfig", () => {
  const tsConfig = loadTsConfig(
    path.resolve(exampleDir, "tsconfig.json"),
    exampleDir
  )
  expect(tsConfig.options.module).toBe(ModuleKind.CommonJS)
  expect(tsConfig.options.target).toBe(ScriptTarget.ES2020)
})
