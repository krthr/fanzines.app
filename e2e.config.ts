import { htmlReporter } from '@e2e-dev/html-reporter'
import { web } from '@e2e-dev/web'
import type { E2EConfig } from 'e2e'
import { chatgpt } from 'e2e/oauth/chatgpt'

const port = process.env.E2E_PORT || '4173'
const externalUrl = process.env.E2E_BASE_URL
const app = {
  url: externalUrl || `http://127.0.0.1:${port}`,
  command: externalUrl ? undefined : {
    executable: 'npm',
    args: ['run', 'test:preview'],
    env: { HOST: '127.0.0.1', PORT: port, NITRO_HOST: '127.0.0.1', NITRO_PORT: port },
    reuseExisting: !process.env.CI,
    startupTimeout: 120_000,
    log: '.e2e/logs/preview.log'
  }
}

export default {
  tests: 'tests/**/*.e2e.ts',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporters: ['list', htmlReporter()],
  trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
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
        reducedMotion: 'reduce'
      }),
      app
    },
    {
      name: 'mobile-webkit',
      engine: web({
        browser: 'webkit',
        viewport: { width: 390, height: 664 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1',
        reducedMotion: 'reduce'
      }),
      app
    }
  ]
} satisfies E2EConfig
