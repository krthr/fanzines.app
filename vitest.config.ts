import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CoverageOptions } from 'vitest/node'
import { defineConfig } from 'vitest/config'
import { unitCoverageOptions } from './test/coverage/config.ts'

const rootDir = dirname(fileURLToPath(import.meta.url))

const coverage = {
  provider: 'custom',
  customProviderModule: 'vitest-monocart-coverage',
  include: ['app/**'],
  coverageReportOptions: unitCoverageOptions
} as CoverageOptions

export default defineConfig({
  resolve: {
    alias: {
      '~~': rootDir,
      '~': resolve(rootDir, 'app')
    }
  },
  test: {
    include: ['test/unit/**/*.test.ts'],
    coverage
  }
})
