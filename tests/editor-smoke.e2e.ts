import type { Browser } from '@e2e-dev/web'
import { expect, type Locator, type Screen } from 'e2e'
import { test as base } from './fixtures'

interface Editor {
  desktop: boolean
  pages: Locator
  addText: Locator
  addShape: Locator
  review: Locator
}

const test = base.extend<{ editor: Editor }>({
  editor: async ({ app, browser, screen }, use) => {
    await app.open('/en/editor')
    await screen.getByTestId('active-page').waitFor()
    const desktop = await browser.evaluate(() => window.matchMedia('(min-width: 1024px)').matches)
    const header = browser.locator('header.ed-topbar')
    const tools = desktop ? header : screen
    await use({
      desktop,
      pages: screen.getByRole(desktop ? 'complementary' : 'navigation', 'Zine pages'),
      addText: tools.getByRole('button', desktop ? 'Text' : '+ Text'),
      addShape: tools.getByRole('button', desktop ? 'Shape' : '+ Shape'),
      review: header.getByRole('button', desktop ? 'Review and print' : 'Review')
    })
  }
})

async function addShape(editor: Editor, screen: Screen, name: 'Rectangle' | 'Circle' | 'Line') {
  await editor.addShape.tap()
  await screen.getByRole('menuitem', name).tap()
}

async function openTwoPageReview(editor: Editor, screen: Screen, browser: Browser) {
  await editor.addText.tap()
  const textBox = screen.getByRole('textbox', 'Edit the zine text')
  await textBox.fill(editor.desktop ? 'Cover headline' : 'Mobile cover')
  if (editor.desktop) {
    await textBox.press('ControlOrMeta+Enter')
  } else {
    // Moving focus commits the inline edit through the mobile editor's blur handler.
    await screen.getByRole('button', 'Settings').focus()
  }
  await textBox.waitFor({ state: 'hidden' })

  if (editor.desktop) {
    await screen.getByRole('heading', /^Text$/i, { level: 2 }).waitFor()
    await screen.getByRole('image', '1 of 8 pages have content').waitFor()
    await addShape(editor, screen, 'Rectangle')
    await screen.getByRole('heading', /^Rectangle$/i, { level: 2 }).waitFor()
  } else {
    await screen.getByRole('button', 'Settings').tap()
    const drawer = screen.getByRole('dialog')
    await drawer.getByRole('heading', /^Text$/i, { level: 2 }).waitFor()
    await browser.keyboard.press('Escape')
    await drawer.waitFor({ state: 'hidden' })
  }

  await editor.pages.getByTestId('page-tile-p1').tap()
  if (editor.desktop) {
    const facingPage = screen.getByTestId('facing-page')
    await facingPage.waitFor()
    await screen.getByRole('button', 'Page').tap()
    await facingPage.waitFor({ state: 'hidden' })
    await screen.getByRole('button', 'Spread').tap()
    await facingPage.waitFor()
    await addShape(editor, screen, 'Circle')
    await screen.getByRole('heading', /^Circle$/i, { level: 2 }).waitFor()
    await screen.getByRole('image', '2 of 8 pages have content').waitFor()
  } else {
    await addShape(editor, screen, 'Rectangle')
    await screen.getByRole('button', 'Delete').waitFor()
  }

  await editor.review.tap()
  return screen.getByRole('region', 'Sheet review')
}

test.describe('Editor smoke flow', { requires: ['browser'] }, () => {
  test('opens on an empty front cover', async ({ editor, screen }) => {
    await expect(editor.pages).toBeVisible()
    await expect(editor.pages.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')
    if (editor.desktop) await expect(screen.getByRole('image', '0 of 8 pages have content')).toBeVisible()
    await expect(screen.getByText(/Drop your photos/i)).toBeVisible()
  })

  test('selects Page 1 from the page list', async ({ editor, screen }) => {
    const pageOne = editor.pages.getByTestId('page-tile-p1')
    await pageOne.tap()

    await expect(pageOne).toHaveAttribute('aria-current', 'page')
    await expect(screen.getByRole('heading', /^Page 1$/i, { level: 2 })).toBeVisible()
    if (editor.desktop) await expect(screen.getByRole('heading', /^Layouts$/i, { level: 2 })).toBeVisible()
  })

  test('renders the populated two-page zine on the A4 review sheet', async ({ editor, screen, browser }) => {
    const review = await openTwoPageReview(editor, screen, browser)
    const preview = review.getByTestId('sheet-preview')

    await expect(review).toBeVisible()
    await expect(preview).toBeVisible()
    await expect(preview.getByRole('image', "Preview of the zine's A4 sheet")).toBeVisible()
    await expect.poll(() => browser.evaluate(() =>
      document.querySelector<HTMLImageElement>('[aria-label="Sheet review"] [data-testid="sheet-preview"] img')?.naturalWidth ?? 0
    )).toBeGreaterThan(0)
    await expect(screen.getByText('2 of 8 pages have content')).toBeVisible()
  })

  test('returns to an empty front cover after reviewing a populated zine', async ({ editor, screen, browser }) => {
    const review = await openTwoPageReview(editor, screen, browser)
    const preview = review.getByTestId('sheet-preview')
    await preview.getByRole('image', "Preview of the zine's A4 sheet").waitFor()
    await screen.getByRole('button', 'Back to editing').tap()
    await screen.getByTestId('active-page').waitFor()
    await preview.waitFor({ state: 'hidden' })

    const confirmations: string[] = []
    if (editor.desktop) {
      await browser.onDialog(async (dialog) => {
        confirmations.push(dialog.type + ': ' + dialog.message)
        await dialog.accept()
      })
      await editor.pages.getByRole('button', 'Reset zine').tap()
    } else {
      await addShape(editor, screen, 'Line')
      await screen.getByRole('button', 'Delete').tap()
      await screen.getByRole('button', 'Layouts').tap()
      const drawer = screen.getByRole('dialog')
      await drawer.getByRole('region', 'Layouts').waitFor()
      await browser.keyboard.press('Escape')
      await drawer.waitFor({ state: 'hidden' })
      await browser.reload()
    }

    if (editor.desktop) {
      expect(confirmations).toEqual([expect.stringMatching(/^confirm: .*Reset the zine/)])
      await expect(screen.getByRole('image', '0 of 8 pages have content')).toBeVisible()
    }
    await expect(screen.getByTestId('active-page')).toBeVisible()
    await expect(editor.pages.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')
    await expect(screen.getByText(/Drop your photos/i)).toBeVisible()
  })
})
