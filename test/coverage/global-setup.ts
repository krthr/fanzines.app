import { rmSync } from 'node:fs'
import { E2E_COVERAGE_DIR } from './config.ts'

export default function globalSetup() {
  rmSync(E2E_COVERAGE_DIR, { recursive: true, force: true })
}
