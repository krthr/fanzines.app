import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const rootDir = dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PLAYWRIGHT_PORT || 4173)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`
const isCoverage = Boolean(process.env.COVERAGE)

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

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  globalSetup: isCoverage ? './test/coverage/global-setup.ts' : undefined,
  globalTeardown: isCoverage ? './test/coverage/global-teardown.ts' : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      }
    },
    {
      name: 'mobile-webkit',
      use: {
        ...devices['iPhone 14'],
        hasTouch: true
      }
    },
    ...(isCoverage
      ? [
          {
            name: 'mobile-chromium',
            use: {
              ...devices['Desktop Chrome'],
              viewport: { width: 390, height: 844 },
              isMobile: true,
              hasTouch: true
            }
          }
        ]
      : [])
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: hasNodePreviewBuild() ? 'npm run preview' : 'npm run build && npm run preview',
        url: baseURL,
        reuseExistingServer: !process.env.CI && !isCoverage,
        timeout: 120_000,
        env: {
          HOST: '127.0.0.1',
          PORT: String(port),
          NITRO_HOST: '127.0.0.1',
          NITRO_PORT: String(port),
          ...(isCoverage ? { COVERAGE: '1' } : {})
        }
      }
})
