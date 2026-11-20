import { expect } from 'e2e'
import { addShape, blurActiveControl, getInspectorRoot, measureInput, openExactMeasures, test } from './helpers/editor'
import { waitForKonvaFrame } from './helpers/canvas'

test.describe('keyboard shortcut isolation and desktop spread mode', { requires: ['browser'] }, () => {
  test.describe('desktop keyboard isolation and spread clicks', () => {
    test.beforeEach(async ({ desktop }) => {
      test.skip(!desktop, 'Desktop layout only')
    })

    test('deletes selected canvas elements with Backspace/Delete but isolates textarea, number fields, and + Shape menu', async ({ openEditor, screen, browser }) => {
      const editor = await openEditor()
      const header = browser.locator('header.ed-topbar')
      const inspector = await getInspectorRoot(editor)

      // 1. Backspace removes a selected element on canvas.
      await addShape(editor, 'Rectangle')
      await expect(inspector.getByRole('heading', /^Rectangle$/i, { level: 2 })).toBeVisible()
      await browser.keyboard.press('Backspace')
      await expect(screen.getByText(/Drop your photos/i)).toBeVisible()

      // 2. Delete removes a selected element on canvas.
      await addShape(editor, 'Circle')
      await expect(inspector.getByRole('heading', /^Circle$/i, { level: 2 })).toBeVisible()
      await browser.keyboard.press('Delete')
      await expect(screen.getByText(/Drop your photos/i)).toBeVisible()

      // 3. Backspace/Delete inside the inline text <textarea> edits text without deleting the element.
      await header.getByRole('button', 'Text').tap()
      const textEditor = screen.getByRole('textbox', 'Edit the zine text')
      await expect(textEditor).toBeVisible()
      await textEditor.fill('Hello!')
      await textEditor.press('Backspace')
      await textEditor.press('ArrowLeft')
      await textEditor.press('Delete')
      await expect(textEditor).toBeVisible()
      await expect(textEditor).toHaveValue('Hell')
      await textEditor.press('ControlOrMeta+Enter')
      await expect(textEditor).toBeHidden()
      await expect(inspector.getByRole('heading', /^Text$/i, { level: 2 })).toBeVisible()

      // 4. Backspace/Delete inside inspector number fields does NOT delete the selected element.
      await addShape(editor, 'Rectangle')
      await expect(inspector.getByRole('heading', /^Rectangle$/i, { level: 2 })).toBeVisible()
      await openExactMeasures(inspector, browser)

      const xInput = measureInput(inspector, 'X')
      await xInput.tap()
      await xInput.press('Backspace')
      await xInput.press('Delete')
      await expect(inspector.getByRole('heading', /^Rectangle$/i, { level: 2 })).toBeVisible()
      await expect(xInput).toBeVisible()

      // Blur number input so canvas shortcuts are active again.
      await blurActiveControl(browser)

      // 5. Opening "+ Shape" menu isolates Delete/Backspace and lets Esc close the menu without dropping selection.
      // Note: Reka UI sets aria-hidden on background regions while the modal menu is open, so we verify
      // selection survival right after closing the menu with Esc.
      await header.getByRole('button', 'Shape').tap()
      const shapeMenu = screen.getByRole('menu')
      await expect(shapeMenu).toBeVisible()

      await browser.keyboard.press('Delete')
      await browser.keyboard.press('Backspace')
      await expect(shapeMenu).toBeVisible()

      await browser.keyboard.press('Escape')
      await expect(shapeMenu).toBeHidden()
      // Selection must still be active after Delete/Backspace inside menu and Esc closing the menu.
      await expect(inspector.getByRole('heading', /^Rectangle$/i, { level: 2 })).toBeVisible()
      await expect(screen.getByRole('toolbar', 'Selection actions')).toBeVisible()

      // A second Esc (with no menu open) drops the selection.
      await browser.keyboard.press('Escape')
      await expect(inspector.getByRole('heading', /^Layouts$/i, { level: 2 })).toBeVisible()
    })

    test('switches focus to the facing page in Spread mode, including inside the overhanging stagePad', async ({ openEditor, screen, browser }) => {
      await openEditor()
      // Navigate to p1 (left side of the p1/p2 spread).
      await screen.getByTestId('page-tile-p1').tap()
      await expect(screen.getByTestId('page-tile-p1')).toHaveAttribute('aria-current', 'page')
      await expect(screen.getByRole('heading', /^Page 1$/i, { level: 2 })).toBeVisible()

      const facingPage = screen.getByTestId('facing-page')
      await expect(facingPage).toBeVisible()
      await waitForKonvaFrame(browser)

      const facingBox = await facingPage.boundingBox()
      expect(facingBox).not.toBeNull()

      // Click inside p1's overhanging stagePad area over the left strip of p2.
      // stagePad is 40px and SPREAD_GAP is 2px, so +15px into facingPage sits squarely under p1's Konva canvas.
      const overhangInset = 15
      const overhangRightX = facingBox!.x + overhangInset
      const overhangRightY = facingBox!.y + facingBox!.height / 2

      const hitTagRight = await browser.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.tagName.toLowerCase() ?? null,
        { x: overhangRightX, y: overhangRightY }
      )
      expect(hitTagRight).toBe('canvas')

      await screen.tapAt({ x: overhangRightX, y: overhangRightY })
      await expect(screen.getByTestId('page-tile-p2')).toHaveAttribute('aria-current', 'page')
      await expect(screen.getByRole('heading', /^Page 2$/i, { level: 2 })).toBeVisible()
      await waitForKonvaFrame(browser)

      // Now p2 is active on the right and p1 is the facing page on the left.
      // Click inside p2's left overhanging stagePad area over the right strip of p1.
      const facingP1Box = await facingPage.boundingBox()
      expect(facingP1Box).not.toBeNull()

      const overhangLeftX = facingP1Box!.x + facingP1Box!.width - overhangInset
      const overhangLeftY = facingP1Box!.y + facingP1Box!.height / 2

      const hitTagLeft = await browser.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.tagName.toLowerCase() ?? null,
        { x: overhangLeftX, y: overhangLeftY }
      )
      expect(hitTagLeft).toBe('canvas')

      await screen.tapAt({ x: overhangLeftX, y: overhangLeftY })
      await expect(screen.getByTestId('page-tile-p1')).toHaveAttribute('aria-current', 'page')
      await expect(screen.getByRole('heading', /^Page 1$/i, { level: 2 })).toBeVisible()
      await waitForKonvaFrame(browser)

      // Finally, click outside the overhang (far right side of p2) to verify direct button click too.
      const facingP2Box = await facingPage.boundingBox()
      expect(facingP2Box).not.toBeNull()
      await screen.tapAt({ x: facingP2Box!.x + facingP2Box!.width * 0.7, y: facingP2Box!.y + facingP2Box!.height / 2 })
      await expect(screen.getByTestId('page-tile-p2')).toHaveAttribute('aria-current', 'page')
      await expect(screen.getByRole('heading', /^Page 2$/i, { level: 2 })).toBeVisible()
    })
  })

  test.describe('mobile keyboard isolation with UDrawer and inline textarea', () => {
    test.beforeEach(async ({ desktop }) => {
      test.skip(desktop, 'Mobile layout only')
    })

    test('closes mobile UDrawer with Esc without dropping selection and isolates Backspace in drawer/textarea', async ({ openEditor, screen, browser }) => {
      const editor = await openEditor()
      // Add a Rectangle on mobile and open the Settings UDrawer.
      await addShape(editor, 'Rectangle')
      await expect(screen.getByRole('button', 'Settings')).toBeVisible()

      await screen.getByRole('button', 'Settings').tap()
      const drawer = screen.getByRole('dialog')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('heading', /^Rectangle$/i, { level: 2 })).toBeVisible()

      // Delete while drawer is open must not delete the element.
      // (Avoid bare Backspace outside inputs on WebKit where Backspace triggers history-back.)
      await browser.keyboard.press('Delete')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('heading', /^Rectangle$/i, { level: 2 })).toBeVisible()

      // Backspace/Delete inside Exact measurements number input in the drawer must not delete the element.
      await openExactMeasures(drawer, browser)
      const xInput = measureInput(drawer, 'X')
      await xInput.tap()
      await xInput.press('Backspace')
      await xInput.press('Delete')
      await blurActiveControl(browser)
      await expect(drawer.getByRole('heading', /^Rectangle$/i, { level: 2 })).toBeVisible()

      // Esc closes the UDrawer WITHOUT dropping the Rectangle selection.
      await browser.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
      await expect(screen.getByRole('button', 'Settings')).toBeVisible()
      await expect(screen.getByRole('button', 'Delete')).toBeVisible()

      // Verify Backspace inside inline <textarea> on mobile does not delete the text element.
      await screen.getByRole('button', 'Delete').tap()
      await screen.getByRole('button', '+ Text').tap()
      const textEditor = screen.getByRole('textbox', 'Edit the zine text')
      await expect(textEditor).toBeVisible()
      await textEditor.fill('Zine!')
      await textEditor.press('Backspace')
      await expect(textEditor).toHaveValue('Zine')
      await blurActiveControl(browser)
      await expect(textEditor).toBeHidden()
      await expect(screen.getByRole('button', 'Settings')).toBeVisible()
    })
  })
})
