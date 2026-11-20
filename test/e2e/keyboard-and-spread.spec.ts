import { expect, test } from './fixtures'
import { STAGE_PAD_DESKTOP, waitForKonvaFrame } from './helpers/canvas'
import {
  addShape,
  getInspectorRoot,
  measureInput,
  openEnglishEditor,
  openExactMeasures
} from './helpers/editor'

test.describe('keyboard shortcut isolation and desktop spread mode', () => {
  test.describe('desktop keyboard isolation and spread clicks', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop layout only')

    test('deletes selected canvas elements with Backspace/Delete but isolates textarea, number fields, and + Shape menu', async ({ page }) => {
      await openEnglishEditor(page)

      const header = page.locator('header.ed-topbar')
      const inspector = await getInspectorRoot(page, false)

      // 1. Backspace removes a selected element on canvas.
      await addShape(page, 'Rectangle', false)
      await expect(inspector.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()
      await page.keyboard.press('Backspace')
      await expect(page.getByText('Drop your photos')).toBeVisible()

      // 2. Delete removes a selected element on canvas.
      await addShape(page, 'Circle', false)
      await expect(inspector.getByRole('heading', { level: 2, name: 'Circle' })).toBeVisible()
      await page.keyboard.press('Delete')
      await expect(page.getByText('Drop your photos')).toBeVisible()

      // 3. Backspace/Delete inside the inline text <textarea> edits text without deleting the element.
      await header.getByRole('button', { name: 'Text' }).click()
      const textEditor = page.getByRole('textbox', { name: 'Edit the zine text' })
      await expect(textEditor).toBeVisible()
      await textEditor.fill('Hello!')
      await textEditor.press('Backspace')
      await textEditor.press('ArrowLeft')
      await textEditor.press('Delete')
      await expect(textEditor).toBeVisible()
      await expect(textEditor).toHaveValue('Hell')
      await textEditor.press('ControlOrMeta+Enter')
      await expect(textEditor).toBeHidden()
      await expect(inspector.getByRole('heading', { level: 2, name: 'Text' })).toBeVisible()

      // 4. Backspace/Delete inside inspector number fields does NOT delete the selected element.
      await addShape(page, 'Rectangle', false)
      await expect(inspector.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()
      await openExactMeasures(inspector)

      const xInput = measureInput(inspector, 'X')
      await xInput.click()
      await xInput.press('Backspace')
      await xInput.press('Delete')
      await expect(inspector.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()
      await expect(xInput).toBeVisible()

      // Blur number input so canvas shortcuts are active again.
      await xInput.blur()

      // 5. Opening "+ Shape" menu isolates Delete/Backspace and lets Esc close the menu without dropping selection.
      // Note: Reka UI sets aria-hidden on background regions while the modal menu is open, so we verify
      // selection survival right after closing the menu with Esc.
      await header.getByRole('button', { name: 'Shape' }).click()
      const shapeMenu = page.getByRole('menu')
      await expect(shapeMenu).toBeVisible()

      await page.keyboard.press('Delete')
      await page.keyboard.press('Backspace')
      await expect(shapeMenu).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(shapeMenu).toBeHidden()
      // Selection must still be active after Delete/Backspace inside menu and Esc closing the menu.
      await expect(inspector.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()
      await expect(page.getByRole('toolbar', { name: 'Selection actions' })).toBeVisible()

      // A second Esc (with no menu open) drops the selection.
      await page.keyboard.press('Escape')
      await expect(inspector.getByRole('heading', { level: 2, name: 'Layouts' })).toBeVisible()
    })

    test('switches focus to the facing page in Spread mode, including inside the overhanging stagePad', async ({ page }) => {
      await openEnglishEditor(page)

      // Navigate to p1 (left side of the p1/p2 spread).
      await page.getByTestId('page-tile-p1').click()
      await expect(page.getByTestId('page-tile-p1')).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('heading', { level: 2, name: 'Page 1' })).toBeVisible()

      const facingPage = page.getByTestId('facing-page')
      await expect(facingPage).toBeVisible()
      await waitForKonvaFrame(page)

      const facingBox = await facingPage.boundingBox()
      expect(facingBox).not.toBeNull()

      // Click inside p1's overhanging stagePad area over the left strip of p2.
      // stagePad is 40px and SPREAD_GAP is 2px, so +15px into facingPage sits squarely under p1's Konva canvas.
      const overhangInset = Math.min(15, STAGE_PAD_DESKTOP - 10)
      const overhangRightX = facingBox!.x + overhangInset
      const overhangRightY = facingBox!.y + facingBox!.height / 2

      const hitTagRight = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.tagName.toLowerCase() ?? null,
        { x: overhangRightX, y: overhangRightY }
      )
      expect(hitTagRight).toBe('canvas')

      await page.mouse.click(overhangRightX, overhangRightY)
      await expect(page.getByTestId('page-tile-p2')).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('heading', { level: 2, name: 'Page 2' })).toBeVisible()
      await waitForKonvaFrame(page)

      // Now p2 is active on the right and p1 is the facing page on the left.
      // Click inside p2's left overhanging stagePad area over the right strip of p1.
      const facingP1Box = await facingPage.boundingBox()
      expect(facingP1Box).not.toBeNull()

      const overhangLeftX = facingP1Box!.x + facingP1Box!.width - overhangInset
      const overhangLeftY = facingP1Box!.y + facingP1Box!.height / 2

      const hitTagLeft = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.tagName.toLowerCase() ?? null,
        { x: overhangLeftX, y: overhangLeftY }
      )
      expect(hitTagLeft).toBe('canvas')

      await page.mouse.click(overhangLeftX, overhangLeftY)
      await expect(page.getByTestId('page-tile-p1')).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('heading', { level: 2, name: 'Page 1' })).toBeVisible()
      await waitForKonvaFrame(page)

      // Finally, click outside the overhang (far right side of p2) to verify direct button click too.
      const facingP2Box = await facingPage.boundingBox()
      expect(facingP2Box).not.toBeNull()
      await page.mouse.click(facingP2Box!.x + facingP2Box!.width * 0.7, facingP2Box!.y + facingP2Box!.height / 2)
      await expect(page.getByTestId('page-tile-p2')).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('heading', { level: 2, name: 'Page 2' })).toBeVisible()
    })
  })

  test.describe('mobile keyboard isolation with UDrawer and inline textarea', () => {
    test.skip(({ isMobile }) => !isMobile, 'Mobile layout only')

    test('closes mobile UDrawer with Esc without dropping selection and isolates Backspace in drawer/textarea', async ({ page }) => {
      await openEnglishEditor(page)

      // Add a Rectangle on mobile and open the Settings UDrawer.
      await addShape(page, 'Rectangle', true)
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()

      await page.getByRole('button', { name: 'Settings' }).click()
      const drawer = page.getByRole('dialog')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()

      // Delete while drawer is open must not delete the element.
      // (Avoid bare Backspace outside inputs on WebKit where Backspace triggers history-back.)
      await page.keyboard.press('Delete')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()

      // Backspace/Delete inside Exact measurements number input in the drawer must not delete the element.
      await openExactMeasures(drawer)
      const xInput = measureInput(drawer, 'X')
      await xInput.click()
      await xInput.press('Backspace')
      await xInput.press('Delete')
      await xInput.blur()
      await expect(drawer.getByRole('heading', { level: 2, name: 'Rectangle' })).toBeVisible()

      // Esc closes the UDrawer WITHOUT dropping the Rectangle selection.
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible()

      // Verify Backspace inside inline <textarea> on mobile does not delete the text element.
      await page.getByRole('button', { name: 'Delete' }).click()
      await page.getByRole('button', { name: '+ Text' }).click()
      const textEditor = page.getByRole('textbox', { name: 'Edit the zine text' })
      await expect(textEditor).toBeVisible()
      await textEditor.fill('Zine!')
      await textEditor.press('Backspace')
      await expect(textEditor).toHaveValue('Zine')
      await textEditor.blur()
      await expect(textEditor).toBeHidden()
      await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
    })
  })
})
