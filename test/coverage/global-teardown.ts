import { MCR } from 'monocart-coverage-reports'
import { e2eCoverageOptions } from './config.ts'

export default async function globalTeardown() {
  const mcr = MCR(e2eCoverageOptions)
  if (!mcr.hasCache()) {
    console.warn('[coverage] No Playwright V8 coverage data collected (no Chromium tests ran).')
    return
  }

  const results = await mcr.generate()
  if (!results || results.files.length === 0) {
    throw new Error('Playwright V8 coverage generation produced no mapped app files.')
  }
}
