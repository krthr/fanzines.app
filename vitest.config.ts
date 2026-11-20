import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~~': rootDir,
      '~': resolve(rootDir, 'app')
    }
  },
  test: {
    include: ['test/unit/**/*.test.ts']
  }
})
