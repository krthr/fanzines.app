import { expect } from 'e2e'
import { test } from './fixtures'

const locales = [
  {
    name: 'English', link: 'English', lang: 'en-US', path: '/en', editor: '/en/editor',
    headline: /One sheet\./i, cta: /Make my zine/i, editorHeading: /Zine editor/i
  },
  {
    name: 'Spanish', link: 'Español', lang: 'es-CO', path: '/', editor: '/editor',
    headline: /Una hoja\./i, cta: /Crear mi fanzine/i, editorHeading: /Editor de fanzines/i
  }
]

test.describe('Landing pages and locale switching', { requires: ['browser'] }, () => {
  test('mounts the Spanish editor and removes its loading fallback', async ({ app, browser, screen }) => {
    await app.open('/editor')

    await expect(screen.getByTestId('active-page')).toBeVisible()
    await expect(browser.locator('html')).toHaveAttribute('lang', 'es-CO')
    await expect(screen.getByRole('heading', /Editor de fanzines/i, { level: 1 })).toBeVisible()
    await expect(screen.getByText('Cargando editor…', { exact: false })).toBeHidden()
  })

  for (const locale of locales) {
    test(`renders the ${locale.name} landing page with its localized editor link`, async ({ app, browser, screen }) => {
      await app.open(locale.path)

      await expect(browser.locator('html')).toHaveAttribute('lang', locale.lang)
      await expect(screen.getByRole('heading', { level: 1 })).toContainText(locale.headline)
      await expect(screen.getByRole('link', locale.cta)).toHaveAttribute('href', locale.editor)
    })

    test(`switches the landing page to ${locale.name} from the header`, async ({ app, browser, screen }) => {
      await app.open('/')
      // Nuxt mounts the route announcer on the client, after the SSR links are present.
      await browser.locator('.nuxt-route-announcer').waitFor({ state: 'attached' })
      const header = screen.getByRole('banner')
      if (locale.lang === 'es-CO') await header.getByRole('link', 'English').tap()

      await header.getByRole('link', locale.link).tap()

      await expect(browser).toHaveURL(locale.path)
      await expect(browser.locator('html')).toHaveAttribute('lang', locale.lang)
      await expect(screen.getByRole('heading', { level: 1 })).toContainText(locale.headline)
    })

    test(`switches the mounted editor to ${locale.name} from the top bar`, async ({ app, browser, screen }) => {
      await app.open('/editor')
      await screen.getByTestId('active-page').waitFor()
      const topbar = browser.locator('header.ed-topbar')
      if (locale.lang === 'es-CO') await topbar.getByRole('link', 'English').tap()

      await topbar.getByRole('link', locale.link).tap()

      await expect(browser).toHaveURL(locale.editor)
      await expect(browser.locator('html')).toHaveAttribute('lang', locale.lang)
      await expect(screen.getByTestId('active-page')).toBeVisible()
      await expect(screen.getByRole('heading', locale.editorHeading, { level: 1 })).toBeVisible()
    })
  }
})
