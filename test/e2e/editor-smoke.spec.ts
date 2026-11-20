import { expect, test } from './fixtures'

test.describe('desktop editor smoke flow', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop layout only')

  test('creates content, switches pages, previews sheet, and resets zine', async ({ page }) => {
    await page.goto('/en/editor')

    const header = page.locator('header.ed-topbar')
    const sidebar = page.getByRole('complementary', { name: 'Zine pages' })

    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(sidebar).toBeVisible()
    await expect(page.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')
    await expect(header.getByRole('img', { name: '0 of 8 pages have content' })).toBeVisible()

    // Add text from the desktop topbar and commit the inline text editor.
    await header.getByRole('button', { name: 'Text' }).click()
    const textEditor = page.getByRole('textbox', { name: 'Edit the zine text' })
    await expect(textEditor).toBeVisible()
    await textEditor.fill('Cover headline')
    await textEditor.press('ControlOrMeta+Enter')
    await expect(textEditor).toBeHidden()

    await expect(page.getByRole('heading', { level: 2, name: 'Text' })).toBeVisible()
    await expect(header.getByRole('img', { name: '1 of 8 pages have content' })).toBeVisible()

    // Add a shape via AddShapeMenu in the topbar.
    await header.getByRole('button', { name: 'Shape' }).click()
    await page.getByRole('menuitem', { name: 'Rectangle' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()

    // Switch to Page 1 via PagesSidebar, check spread facing page, and add another shape.
    await page.getByTestId('page-tile-p1').click()
    await expect(page.getByTestId('page-tile-p1')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 2, name: 'Page 1' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Layouts' })).toBeVisible()

    await page.getByRole('button', { name: 'Spread' }).click()
    await expect(page.getByTestId('facing-page')).toBeVisible()
    await page.getByRole('button', { name: 'Page', exact: true }).click()
    await expect(page.getByTestId('facing-page')).toBeHidden()

    await header.getByRole('button', { name: 'Shape' }).click()
    await page.getByRole('menuitem', { name: 'Circle' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Circle' })).toBeVisible()
    await expect(header.getByRole('img', { name: '2 of 8 pages have content' })).toBeVisible()

    // Enter Review mode and confirm SheetPreview renders its imposed A4 bitmap.
    await header.getByRole('button', { name: 'Review and print' }).click()
    const reviewRegion = page.getByRole('region', { name: 'Sheet review' })
    await expect(reviewRegion).toBeVisible()

    const sheetPreview = reviewRegion.getByTestId('sheet-preview')
    await expect(sheetPreview).toBeVisible()
    const sheetImage = sheetPreview.getByRole('img', { name: "Preview of the zine's A4 sheet" })
    await expect(sheetImage).toBeVisible()
    await expect.poll(async () => sheetImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await expect(page.getByText('2 of 8 pages have content')).toBeVisible()

    // Return to Design mode.
    await header.getByRole('button', { name: 'Back to editing' }).click()
    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(sheetPreview).toBeHidden()

    // Reset the zine and accept the browser confirm dialog.
    let dialogMessage = ''
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm')
      dialogMessage = dialog.message()
      await dialog.accept()
    })

    await sidebar.getByRole('button', { name: 'Reset zine' }).click()
    await expect.poll(() => dialogMessage).toContain('Reset the zine')
    await expect(page.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')
    await expect(header.getByRole('img', { name: '0 of 8 pages have content' })).toBeVisible()
    await expect(page.getByText('Drop your photos')).toBeVisible()
  })
})

test.describe('mobile editor smoke flow', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile layout only')

  test('creates content with MobileBar, PageStrip, and UDrawer, previews sheet, and resets', async ({ page }) => {
    await page.goto('/en/editor')

    const header = page.locator('header.ed-topbar')
    const pageStrip = page.getByRole('navigation', { name: 'Zine pages' })

    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(pageStrip).toBeVisible()
    await expect(page.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')

    // Add text from MobileBar and commit via blur.
    await page.getByRole('button', { name: '+ Text' }).click()
    const textEditor = page.getByRole('textbox', { name: 'Edit the zine text' })
    await expect(textEditor).toBeVisible()
    await textEditor.fill('Mobile cover')
    await textEditor.blur()
    await expect(textEditor).toBeHidden()

    // Open the settings UDrawer and confirm ElementInspector mounts inside it.
    await page.getByRole('button', { name: 'Settings' }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('heading', { level: 2, name: 'Text' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // Switch to Page 1 via PageStrip.
    await page.getByTestId('page-tile-p1').click()
    await expect(page.getByTestId('page-tile-p1')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 2, name: 'Page 1' })).toBeVisible()

    // Add a shape via MobileBar.
    await page.getByRole('button', { name: '+ Shape' }).click()
    await page.getByRole('menuitem', { name: 'Rectangle' }).click()
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()

    // Enter Review mode and verify SheetPreview renders.
    await header.getByRole('button', { name: 'Review' }).click()
    const reviewRegion = page.getByRole('region', { name: 'Sheet review' })
    await expect(reviewRegion).toBeVisible()

    const sheetPreview = reviewRegion.getByTestId('sheet-preview')
    await expect(sheetPreview).toBeVisible()
    const sheetImage = sheetPreview.getByRole('img', { name: "Preview of the zine's A4 sheet" })
    await expect(sheetImage).toBeVisible()
    await expect.poll(async () => sheetImage.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    await expect(page.getByText('2 of 8 pages have content')).toBeVisible()

    // Return to Design mode.
    await page.getByRole('button', { name: 'Back to editing' }).click()
    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(sheetPreview).toBeHidden()

    // Exercise deleting an element from MobileBar and opening the Layouts UDrawer.
    await page.getByRole('button', { name: '+ Shape' }).click()
    await page.getByRole('menuitem', { name: 'Line' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('button', { name: 'Layouts' })).toBeVisible()

    await page.getByRole('button', { name: 'Layouts' }).click()
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('heading', { level: 2, name: 'Layouts' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // Mobile omits the desktop sidebar reset button; reloading resets in-memory zine state.
    await page.reload()
    await expect(page.getByTestId('active-page')).toBeVisible()
    await expect(page.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Drop your photos')).toBeVisible()
  })
})
