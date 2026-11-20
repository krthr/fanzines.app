import { htmlReporter } from '@e2e-dev/html-reporter'
import { web } from '@e2e-dev/web'
import { devices } from '@playwright/test'
import type { E2EConfig } from 'e2e'
import { chatgpt } from 'e2e/oauth/chatgpt'
import { baseURL, isCoverage, previewServer } from './test/preview.ts'

const app = {
  url: baseURL,
  command: previewServer && {
    executable: 'npm',
    args: ['run', previewServer.script],
    env: previewServer.env,
    reuseExisting: previewServer.reuseExisting,
    startupTimeout: previewServer.startupTimeout,
    log: '.e2e/logs/preview.log'
  }
}
const chrome = devices['Desktop Chrome']
const iphone = devices['iPhone 14']

export default {
  tests: 'tests/**/*.e2e.ts',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporters: ['list', htmlReporter()],
  trace: 'on-first-retry',
  agents: {
    default: {
      model: chatgpt('gpt-6-luna'),
      context: 'Fanzines is a bilingual editor for creating and printing a folded eight-page zine.'
    }
  },
  targets: [
    {
      name: 'desktop-chromium',
      engine: web({
        browser: 'chromium',
        viewport: { width: 1280, height: 800 },
        userAgent: chrome.userAgent,
        reducedMotion: 'reduce'
      }),
      app
    },
    {
      name: 'mobile-webkit',
      engine: web({
        browser: 'webkit',
        viewport: iphone.viewport,
        userAgent: iphone.userAgent,
        reducedMotion: 'reduce'
      }),
      app
    },
    ...(isCoverage ? [{
      name: 'mobile-chromium',
      engine: web({
        browser: 'chromium',
        viewport: { width: 390, height: 844 },
        userAgent: chrome.userAgent,
        reducedMotion: 'reduce'
      }),
      app
    }] : [])
  ]
} satisfies E2EConfig
