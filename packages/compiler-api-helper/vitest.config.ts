import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
})
