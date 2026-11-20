import { defineConfig, devices } from '@playwright/test'
import { baseURL, isCoverage, previewServer } from './test/preview.ts'

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
  webServer: previewServer && {
    command: `npm run ${previewServer.script}`,
    url: baseURL,
    reuseExistingServer: previewServer.reuseExisting,
    timeout: previewServer.startupTimeout,
    env: previewServer.env
  }
})
