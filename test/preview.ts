import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const port = Number(process.env.PLAYWRIGHT_PORT || 4173)
export const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`
export const isCoverage = Boolean(process.env.COVERAGE)

function hasClientSourcemaps(): boolean {
  const nuxtAssetsDir = resolve(rootDir, '.output/public/_nuxt')
  if (!existsSync(nuxtAssetsDir)) return false

  try {
    return readdirSync(nuxtAssetsDir).some((file) => file.endsWith('.js.map'))
  } catch {
    return false
  }
}

function hasNodePreviewBuild(): boolean {
  const nitroMetaPath = resolve(rootDir, '.output/nitro.json')
  if (!existsSync(nitroMetaPath)) return false

  try {
    const meta = JSON.parse(readFileSync(nitroMetaPath, 'utf8')) as { preset?: string }
    if (meta.preset !== 'node-server') return false
    return !isCoverage || hasClientSourcemaps()
  } catch {
    return false
  }
}

export const previewServer = process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : {
      script: 'test:preview',
      reuseExisting: !process.env.CI && !isCoverage,
      startupTimeout: 120_000,
      env: {
        HOST: '127.0.0.1',
        PORT: String(port),
        NITRO_HOST: '127.0.0.1',
        NITRO_PORT: String(port),
        ...(isCoverage ? { COVERAGE: '1' } : {})
      }
    }

// Inspect the build at server startup so runner and worker configs stay identical.
if (import.meta.main && !hasNodePreviewBuild()) {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })
}
