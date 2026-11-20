import { test as base } from '@e2e-dev/web'
import { expect } from 'e2e'

export const test = base.extend<{ browserChecks: void }>({
  browserChecks: [async ({ browser }, use) => {
    await browser.route(/^https?:\/\/([^/]+\.)?posthog\.com(\/|$)/i, async (route) => {
      if (new URL(route.request.url).pathname.endsWith('.js')) {
        await route.fulfill({ contentType: 'application/javascript', body: '' })
      } else {
        await route.fulfill({ json: {} })
      }
    })

    // Keep earlier errors when a locale link loads a new document in the same tab.
    const storageKey = 'e2e:page-errors'
    await browser.addInitScript((key) => {
      if (window.origin === 'null') return
      const record = (message: string) => {
        const errors: string[] = JSON.parse(sessionStorage.getItem(key) ?? '[]')
        errors.push(message)
        sessionStorage.setItem(key, JSON.stringify(errors))
      }
      const { error, warn } = console
      console.error = (...args) => {
        record('console.error: ' + args.join(' '))
        error.apply(console, args)
      }
      console.warn = (...args) => {
        const message = args.join(' ')
        if (/hydration/i.test(message)) record('console.warn: ' + message)
        warn.apply(console, args)
      }
      window.addEventListener('error', (event) => record('pageerror: ' + event.message))
      window.addEventListener('unhandledrejection', (event) => record('pageerror: ' + event.reason))
    }, storageKey)

    await use()
    const errors = await browser.evaluate((key): string[] => {
      if (window.origin === 'null') return []
      return JSON.parse(sessionStorage.getItem(key) ?? '[]')
    }, storageKey)
    expect(errors, 'Unexpected console or page errors').toEqual([])
  }, { auto: true }]
})
