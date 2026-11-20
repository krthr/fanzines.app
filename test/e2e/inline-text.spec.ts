import { expect, test } from './fixtures'
import {
  PAGE_H,
  PAGE_W,
  doubleTapAt,
  mmToUnits,
  pagePoint,
  waitForKonvaFrame
} from './helpers/canvas'
import {
  addTextAndCommit,
  openEnglishEditor,
  readMeasures
} from './helpers/editor'

test.describe('inline text editing', () => {
  test('enters edit mode via + Text, double-click/double-tap, and Enter; supports Esc cancel and commit methods', async ({ page, isMobile }) => {
    await openEnglishEditor(page)

    const textEditor = page.getByRole('textbox', { name: 'Edit the zine text' })

    // 1. Enter inline edit mode via "+ Text" and commit via blur.
    if (isMobile) {
      await page.getByRole('button', { name: '+ Text' }).click()
    } else {
      await page.locator('header.ed-topbar').getByRole('button', { name: 'Text' }).click()
    }
    await expect(textEditor).toBeVisible()
    await expect(textEditor).toHaveValue('Type here')

    await textEditor.fill('First draft')
    await textEditor.blur()
    await expect(textEditor).toBeHidden()
    await waitForKonvaFrame(page)

    // Locate the center of the text box on canvas for double-click / double-tap.
    const textBox = await readMeasures(page, { isMobile })
    const textCenter = await pagePoint(
      page,
      mmToUnits(textBox.x + textBox.width / 2),
      mmToUnits(textBox.y + (textBox.height ?? 13) / 2)
    )

    // 2. Re-enter inline edit mode via double-click (desktop) or double-tap (mobile).
    if (isMobile) {
      await doubleTapAt(page, textCenter)
    } else {
      await page.mouse.dblclick(textCenter.x, textCenter.y)
    }

    await expect(textEditor).toBeVisible()
    await expect(textEditor).toHaveValue('First draft')

    // 3. Esc cancels edits without mutating the saved text.
    await textEditor.fill('Should be discarded')
    await textEditor.press('Escape')
    await expect(textEditor).toBeHidden()
    await waitForKonvaFrame(page)

    // 4. Re-enter via Enter while selected (desktop) or double-tap (mobile) and verify saved text is intact.
    if (isMobile) {
      await doubleTapAt(page, textCenter)
    } else {
      await page.keyboard.press('Enter')
    }
    await expect(textEditor).toBeVisible()
    await expect(textEditor).toHaveValue('First draft')

    // 5. Commit via ControlOrMeta+Enter.
    await textEditor.fill('Committed headline')
    await textEditor.press('ControlOrMeta+Enter')
    await expect(textEditor).toBeHidden()
    await waitForKonvaFrame(page)

    // Verify committed text persisted.
    if (isMobile) {
      await doubleTapAt(page, textCenter)
    } else {
      await page.keyboard.press('Enter')
    }
    await expect(textEditor).toBeVisible()
    await expect(textEditor).toHaveValue('Committed headline')
    await textEditor.press('Escape')
    await expect(textEditor).toBeHidden()
  })

  test('grows text box height on multiline wrapping', async ({ page, isMobile }) => {
    await openEnglishEditor(page)

    await addTextAndCommit(page, 'One line', { isMobile })
    const initialMeasures = await readMeasures(page, { isMobile })

    const textCenter = await pagePoint(
      page,
      mmToUnits(initialMeasures.x + initialMeasures.width / 2),
      mmToUnits(initialMeasures.y + (initialMeasures.height ?? 13) / 2)
    )

    if (isMobile) {
      await doubleTapAt(page, textCenter)
    } else {
      await page.keyboard.press('Enter')
    }

    const textEditor = page.getByRole('textbox', { name: 'Edit the zine text' })
    await expect(textEditor).toBeVisible()
    const initialEditorBox = await textEditor.boundingBox()
    expect(initialEditorBox).not.toBeNull()

    const multilineCopy = [
      'Line one of the zine manifesto',
      'Line two wraps across the panel width cleanly',
      'Line three adds even more vertical height',
      'Line four keeps pushing the text frame down',
      'Line five verifies automatic box expansion'
    ].join('\n')

    await textEditor.fill(multilineCopy)

    await expect.poll(async () => (await textEditor.boundingBox())?.height ?? 0).toBeGreaterThan(
      initialEditorBox!.height + 30
    )

    if (isMobile) {
      await textEditor.blur()
    } else {
      await textEditor.press('ControlOrMeta+Enter')
    }
    await expect(textEditor).toBeHidden()

    const grownMeasures = await readMeasures(page, { isMobile })
    expect(grownMeasures.height!).toBeGreaterThan(initialMeasures.height! + 15)
  })

  test('auto-deletes cleared text on deselect and on page switch', async ({ page, isMobile }) => {
    await openEnglishEditor(page)
    const textEditor = page.getByRole('textbox', { name: 'Edit the zine text' })

    // Case A: clearing text and deselecting removes the empty text element.
    await addTextAndCommit(page, 'Temporary text', { isMobile })

    const firstMeasures = await readMeasures(page, { isMobile })
    const firstCenter = await pagePoint(
      page,
      mmToUnits(firstMeasures.x + firstMeasures.width / 2),
      mmToUnits(firstMeasures.y + (firstMeasures.height ?? 13) / 2)
    )

    if (isMobile) {
      await doubleTapAt(page, firstCenter)
    } else {
      await page.keyboard.press('Enter')
    }
    await expect(textEditor).toBeVisible()
    await textEditor.fill('   ')
    await textEditor.press('ControlOrMeta+Enter')
    await expect(textEditor).toBeHidden()

    // Deselect by tapping/clicking empty canvas below the text box.
    const emptyArea = await pagePoint(page, PAGE_W * 0.5, PAGE_H * 0.85)
    if (isMobile) {
      await page.touchscreen.tap(emptyArea.x, emptyArea.y)
    } else {
      await page.mouse.click(emptyArea.x, emptyArea.y)
    }

    await expect(page.getByText('Drop your photos')).toBeVisible()

    // Case B: clearing text and switching pages removes the empty text element.
    await addTextAndCommit(page, 'Another temporary', { isMobile })

    const secondMeasures = await readMeasures(page, { isMobile })
    const secondCenter = await pagePoint(
      page,
      mmToUnits(secondMeasures.x + secondMeasures.width / 2),
      mmToUnits(secondMeasures.y + (secondMeasures.height ?? 13) / 2)
    )

    if (isMobile) {
      await doubleTapAt(page, secondCenter)
    } else {
      await page.keyboard.press('Enter')
    }
    await expect(textEditor).toBeVisible()
    await textEditor.fill('')
    await textEditor.press('ControlOrMeta+Enter')
    await expect(textEditor).toBeHidden()

    await page.getByTestId('page-tile-p1').click()
    await expect(page.getByTestId('page-tile-p1')).toHaveAttribute('aria-current', 'page')

    await page.getByTestId('page-tile-front-cover').click()
    await expect(page.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Drop your photos')).toBeVisible()
  })
})
