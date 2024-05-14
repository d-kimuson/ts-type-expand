// @ts-check
import { resolve } from 'node:path'
import { FlatCompat } from '@eslint/eslintrc'
import jsEslint from '@eslint/js'
import typeScriptESLintParser from '@typescript-eslint/parser'
import { jsRules, tsRules } from 'eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier'
// @ts-expect-error -- 型定義が提供されていない
import importPlugin from 'eslint-plugin-import'
import ununsedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

const compat = new FlatCompat({
  baseDirectory: resolve(process.cwd()),
})

const config = tsEslint.config(
  {
    ignores: ['dist', 'test-project', 'vitest.config.ts', 'tsup.config.ts'],
  },
  jsEslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...compat.extends(),
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,mts,cts}', '**/*.{js,mjs,cjs}'],
    plugins: {
      'unused-imports': ununsedImports,
      import: importPlugin,
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.mts', '.cts'],
        espree: ['.js', '.cjs', '.mjs'],
      },
      'import/resolver': {
        typescript: {
          project: ['tsconfig.json'],
          alwaysTryTypes: true,
        },
        node: true,
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...jsRules,
    },
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      parser: typeScriptESLintParser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      ...tsRules,
    },
  },
)

export default config
