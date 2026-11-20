import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CoverageReportOptions, V8CoverageEntry } from 'monocart-coverage-reports'

export const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const COVERAGE_RAW_ROOT = resolve(ROOT_DIR, '.coverage')
export const UNIT_COVERAGE_DIR = resolve(COVERAGE_RAW_ROOT, 'unit')
export const UNIT_RAW_DIR = resolve(UNIT_COVERAGE_DIR, 'raw')
export const E2E_COVERAGE_DIR = resolve(COVERAGE_RAW_ROOT, 'e2e')
export const E2E_RAW_DIR = resolve(E2E_COVERAGE_DIR, 'raw')
export const MERGED_COVERAGE_DIR = resolve(ROOT_DIR, 'coverage')
export const NUXT_PUBLIC_DIR = resolve(ROOT_DIR, '.output/public')

const EXCLUDED_SEGMENTS = ['/node_modules/', '/.nuxt/', 'virtual:', '\0']
const sourceMapCache = new Map<string, Record<string, unknown> | null>()

function stripQuery(filePath: string): string {
  return filePath.replace(/\\/g, '/').split('?')[0] ?? ''
}

function isExcludedPath(cleanPath: string): boolean {
  if (!cleanPath) return true
  if (cleanPath.startsWith('node_modules/') || cleanPath.startsWith('.nuxt/')) return true
  return EXCLUDED_SEGMENTS.some((segment) => cleanPath.includes(segment))
}

export function isAppSourcePath(filePath: string): boolean {
  const clean = stripQuery(filePath)
  if (isExcludedPath(clean)) return false
  return /(?:^|\/)app\/.+\.(?:ts|vue)$/.test(clean)
}

export function normalizeAppSourcePath(filePath: string): string {
  const clean = stripQuery(filePath)
  if (isExcludedPath(clean)) return clean
  const match = clean.match(/(?:^|\/)(app\/.+)$/)
  return match?.[1] ?? clean
}

function loadLocalClientSourceMap(url: string): Record<string, unknown> | null {
  if (sourceMapCache.has(url)) {
    return sourceMapCache.get(url) ?? null
  }

  let mapPath: string | null = null
  try {
    const { pathname } = new URL(url)
    if (pathname.startsWith('/_nuxt/') && pathname.endsWith('.map') && !pathname.includes('..')) {
      mapPath = resolve(NUXT_PUBLIC_DIR, pathname.slice(1))
    }
  } catch {
    mapPath = null
  }

  if (!mapPath || !existsSync(mapPath)) {
    sourceMapCache.set(url, null)
    return null
  }

  try {
    const parsed = JSON.parse(readFileSync(mapPath, 'utf8')) as Record<string, unknown>
    sourceMapCache.set(url, parsed)
    return parsed
  } catch {
    sourceMapCache.set(url, null)
    return null
  }
}

export const unitCoverageOptions: CoverageReportOptions = {
  name: 'Fanzines Unit Coverage',
  baseDir: ROOT_DIR,
  outputDir: UNIT_COVERAGE_DIR,
  cleanCache: true,
  entryFilter: (entry: V8CoverageEntry) => isAppSourcePath(entry.url),
  sourceFilter: isAppSourcePath,
  sourcePath: normalizeAppSourcePath,
  outputFilter: (entry) => entry.sourcePath.startsWith('app/'),
  reports: [
    ['raw', { outputDir: 'raw', merge: true }],
    ['console-details'],
    ['v8']
  ]
}

export const e2eCoverageOptions: CoverageReportOptions = {
  name: 'Fanzines E2E Coverage',
  baseDir: ROOT_DIR,
  outputDir: E2E_COVERAGE_DIR,
  // Workers share this cache; global-setup cleans E2E_COVERAGE_DIR once before workers start.
  cleanCache: false,
  entryFilter: (entry: V8CoverageEntry) => /\/_nuxt\/[^/?#]+\.js(?:$|[?#])/.test(entry.url),
  sourceFilter: isAppSourcePath,
  sourcePath: normalizeAppSourcePath,
  outputFilter: (entry) => entry.sourcePath.startsWith('app/'),
  sourceMapResolver: async (url, defaultResolver) => {
    const local = loadLocalClientSourceMap(url)
    if (local) return local
    return defaultResolver(url)
  },
  reports: [
    ['raw', { outputDir: 'raw', merge: true }],
    ['console-summary'],
    ['v8']
  ]
}

export const mergedCoverageOptions: CoverageReportOptions = {
  name: 'Fanzines Unified Coverage (Vitest + Playwright)',
  baseDir: ROOT_DIR,
  inputDir: [UNIT_RAW_DIR, E2E_RAW_DIR],
  outputDir: MERGED_COVERAGE_DIR,
  cleanCache: true,
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
