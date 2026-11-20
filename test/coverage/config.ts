import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CoverageReportOptions, V8CoverageEntry } from 'monocart-coverage-reports'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const EXCLUDED_SEGMENTS = ['/node_modules/', '/.nuxt/', 'virtual:', '\0']

function stripQuery(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('?')[0] ?? ''
}

function isExcludedPath(cleanPath: string): boolean {
  if (!cleanPath) return true
  if (cleanPath.startsWith('node_modules/') || cleanPath.startsWith('.nuxt/')) return true
  return EXCLUDED_SEGMENTS.some((segment) => cleanPath.includes(segment))
}

function isAppSourcePath(filePath: string): boolean {
  const clean = stripQuery(filePath)
  if (isExcludedPath(clean)) return false
  return /(?:^|\/)app\/.+\.(?:ts|vue)$/.test(clean)
}

function normalizeAppSourcePath(filePath: string): string {
  const clean = stripQuery(filePath)
  if (isExcludedPath(clean)) return clean
  const match = clean.match(/(?:^|\/)(app\/.+)$/)
  return match?.[1] ?? clean
}

export const unitCoverageOptions: CoverageReportOptions = {
  name: 'Fanzines Unit Coverage',
  baseDir: ROOT_DIR,
  outputDir: resolve(ROOT_DIR, 'coverage'),
  cleanCache: true,
  entryFilter: (entry: V8CoverageEntry) => isAppSourcePath(entry.url),
  sourceFilter: isAppSourcePath,
  sourcePath: normalizeAppSourcePath,
  outputFilter: (entry) => entry.sourcePath.startsWith('app/'),
  lcov: true,
  reports: [
    ['v8'],
    ['console-details'],
    ['markdown-summary', { outputFile: 'coverage-summary.md' }],
    ['markdown-details', { outputFile: 'coverage-details.md' }],
    ['v8-json', { outputFile: 'coverage-report.json' }]
  ]
}
