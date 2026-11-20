import { existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { MCR } from 'monocart-coverage-reports'
import {
  E2E_RAW_DIR,
  MERGED_COVERAGE_DIR,
  UNIT_RAW_DIR,
  mergedCoverageOptions
} from './config.ts'

function assertRawShard(dir: string, label: string) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`Missing ${label} raw coverage directory: ${dir}`)
  }

  const coverageFiles = readdirSync(dir).filter(
    (name) => name.startsWith('coverage-') && name.endsWith('.json')
  )
  if (coverageFiles.length === 0) {
    throw new Error(`Empty ${label} raw coverage directory (no coverage-*.json files): ${dir}`)
  }
}

assertRawShard(UNIT_RAW_DIR, 'Vitest unit')
assertRawShard(E2E_RAW_DIR, 'Playwright E2E')

rmSync(MERGED_COVERAGE_DIR, { recursive: true, force: true })

const results = await MCR(mergedCoverageOptions).generate()
if (!results || results.files.length === 0) {
  throw new Error('Merged V8 coverage report produced no app source files.')
}
