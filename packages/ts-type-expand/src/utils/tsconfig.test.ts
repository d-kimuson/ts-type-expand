import path from 'node:path'
import { ModuleKind, ScriptTarget } from 'typescript'
import { loadTsConfig } from '~/utils/tsconfig'
import { it, expect } from 'vitest'

const exampleDir = path.resolve(__dirname, '../../../example')

it('load example tsconfig', () => {
  const tsConfig = loadTsConfig(
    path.resolve(exampleDir, 'tsconfig.json'),
    exampleDir,
  )
  expect(tsConfig.options.module).toBe(ModuleKind.CommonJS)
  expect(tsConfig.options.target).toBe(ScriptTarget.ES2020)
})
