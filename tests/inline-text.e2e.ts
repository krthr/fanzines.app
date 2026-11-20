import { expect } from 'e2e'
import { PAGE_H, PAGE_W, pagePoint, tapCanvas, waitForKonvaFrame } from './helpers/canvas'
import { addTextAndCommit, blurActiveControl, editSelectedText, readMeasures, selectedTextCenter, test } from './helpers/editor'

test.describe('Inline text editing', { requires: ['browser'] }, () => {
  test('reopens a blurred draft, cancels changes with Escape and saves with the keyboard shortcut', async ({ openEditor, screen, browser }) => {
    const editor = await openEditor()
    await editor.addText.tap()
    const field = screen.getByRole('textbox', 'Edit the zine text')
    await expect(field).toHaveValue('Type here')
    await field.fill('First draft')
    await blurActiveControl(browser)
    await field.waitFor({ state: 'hidden' })
    const center = await selectedTextCenter(editor)
    await tapCanvas(editor, center, true)
    await expect(field).toHaveValue('First draft')

    await field.fill('Should be discarded')
    await field.press('Escape')
    await field.waitFor({ state: 'hidden' })
    await editSelectedText(editor)
    await expect(field).toHaveValue('First draft')
    await field.fill('Committed headline')
    await field.press('ControlOrMeta+Enter')
    await field.waitFor({ state: 'hidden' })
    await editSelectedText(editor)

    await expect(field).toBeVisible()
    await expect(field).toHaveValue('Committed headline')
  })

  test('grows the inline editor and saved text box when text wraps', async ({ openEditor, screen, browser }) => {
    const editor = await openEditor()
    await addTextAndCommit(editor, 'One line')
    const initial = await readMeasures(editor)
    await editSelectedText(editor)
    const field = screen.getByRole('textbox', 'Edit the zine text')
    const initialBox = await field.boundingBox()
    if (!initialBox) throw new Error('The inline editor has no bounding box')

    await field.fill([
      'Line one of the zine manifesto',
      'Line two wraps across the panel width cleanly',
      'Line three adds even more vertical height',
      'Line four keeps pushing the text frame down',
      'Line five verifies automatic box expansion'
    ].join('\n'))
    await expect.poll(async () => (await field.boundingBox())?.height ?? 0).toBeGreaterThan(initialBox.height + 30)
    if (editor.desktop) await field.press('ControlOrMeta+Enter')
    else await blurActiveControl(browser)
    await field.waitFor({ state: 'hidden' })

    expect((await readMeasures(editor)).height!).toBeGreaterThan(initial.height! + 15)
  })

  for (const trigger of ['deselect', 'page switch'] as const) {
    test(`removes cleared text on ${trigger}`, async ({ openEditor, screen }) => {
      const editor = await openEditor()
      await addTextAndCommit(editor, 'Temporary text')
      await editSelectedText(editor)
      const field = screen.getByRole('textbox', 'Edit the zine text')
      await field.fill(trigger === 'deselect' ? '   ' : '')
      await field.press('ControlOrMeta+Enter')
      await field.waitFor({ state: 'hidden' })

      if (trigger === 'deselect') {
        await tapCanvas(editor, await pagePoint(editor, PAGE_W * 0.5, PAGE_H * 0.85))
      } else {
        const pageOne = editor.pages.getByTestId('page-tile-p1')
        await pageOne.tap()
        await expect(pageOne).toHaveAttribute('aria-current', 'page')
        await editor.pages.getByTestId('page-tile-front-cover').tap()
      }
      await waitForKonvaFrame(editor.browser)

      await expect(editor.pages.getByTestId('page-tile-front-cover')).toHaveAttribute('aria-current', 'page')
      await expect(screen.getByText(/Drop your photos/i)).toBeVisible()
    })
  }
})
