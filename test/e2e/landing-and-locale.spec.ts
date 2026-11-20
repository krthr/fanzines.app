import { expect, test } from './fixtures'

test.describe('landing pages and locale switching', () => {
  test('renders Spanish and English landing pages cleanly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Una hoja.')
    await expect(page.getByRole('link', { name: 'Crear mi fanzine' })).toHaveAttribute('href', '/editor')

    await page.goto('/en', { waitUntil: 'networkidle' })

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('One sheet.')
    await expect(page.getByRole('link', { name: 'Make my zine' })).toHaveAttribute('href', '/en/editor')
  })

  test('navigates between / and /en via LocaleSwitch', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.getByRole('banner').getByRole('link', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('One sheet.')

    await page.getByRole('banner').getByRole('link', { name: 'Español' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Una hoja.')
  })

  test('mounts ZineEditor inside ClientOnly and switches between /editor and /en/editor', async ({ page }) => {
    await page.goto('/editor', { waitUntil: 'networkidle' })

    const topbar = page.locator('header.ed-topbar')

    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO')
    await expect(page.getByRole('heading', { level: 1, name: 'Editor de fanzines' })).toBeVisible()
    await expect(page.getByText('Cargando editor…')).toBeHidden()

    await topbar.getByRole('link', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en\/editor$/)
    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.getByRole('heading', { level: 1, name: 'Zine editor' })).toBeVisible()

    await topbar.getByRole('link', { name: 'Español' }).click()
    await expect(page).toHaveURL(/\/editor$/)
    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO')
    await expect(page.getByRole('heading', { level: 1, name: 'Editor de fanzines' })).toBeVisible()
  })
})
