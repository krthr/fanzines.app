import { test as base, expect, type ConsoleMessage } from '@playwright/test'

const POSTHOG_HOST_PATTERN = /^https?:\/\/([^/]+\.)?posthog\.com(\/|$)/i
const HYDRATION_WARNING_PATTERN = /hydration/i

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(POSTHOG_HOST_PATTERN, async (route) => {
      const url = route.request().url()

      if (url.endsWith('.js') || url.includes('.js?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: ''
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}'
      })
    })

    await use(context)
  },
  page: async ({ page }, use) => {
    const errors: string[] = []

    const onConsole = (message: ConsoleMessage) => {
      const type = message.type()
      const text = message.text()

      if (type === 'error') {
        errors.push(`console.error: ${text}`)
      } else if (type === 'warning' && HYDRATION_WARNING_PATTERN.test(text)) {
        errors.push(`console.warn (hydration): ${text}`)
      }
    }

    const onPageError = (error: Error) => {
      errors.push(`pageerror: ${error.stack || error.message}`)
    }

    page.on('console', onConsole)
    page.on('pageerror', onPageError)

    await use(page)

    page.off('console', onConsole)
    page.off('pageerror', onPageError)

    expect(errors, 'Unexpected console or page errors').toEqual([])
  }
})

export { expect }
