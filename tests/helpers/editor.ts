import type { Browser } from '@e2e-dev/web'
import { expect, type Locator, type Screen } from 'e2e'
import { PAGE_H, PAGE_W, isPixelCloseTo, readCanvasPixel, mmToUnits, pagePoint, tapCanvas, waitForKonvaFrame } from './canvas'
import { test as base } from '../fixtures'

export interface Editor {
  browser: Browser
  screen: Screen
  desktop: boolean
  pages: Locator
  addText: Locator
  addShape: Locator
  review: Locator
}

export const test = base.extend<{ desktop: boolean, openEditor: () => Promise<Editor> }>({
  desktop: async ({ browser }, use) => {
    // A fresh attempt has a browser context but no tab to measure yet.
    await browser.newTab()
    await use(await browser.evaluate(() => window.matchMedia('(min-width: 1024px)').matches))
  },
  openEditor: async ({ app, browser, screen, desktop }, use) => {
    await use(async () => {
      await app.open('/en/editor')
      await screen.getByTestId('active-page').waitFor()
      const header = browser.locator('header.ed-topbar')
      const tools = desktop ? header : screen
      return {
        browser,
        screen,
        desktop,
        pages: screen.getByRole(desktop ? 'complementary' : 'navigation', 'Zine pages'),
        addText: tools.getByRole('button', desktop ? 'Text' : '+ Text'),
        addShape: tools.getByRole('button', desktop ? 'Shape' : '+ Shape'),
        review: header.getByRole('button', desktop ? 'Review and print' : 'Review')
      }
    })
  }
})

export async function addShape(editor: Editor, name: 'Rectangle' | 'Circle' | 'Line') {
  await editor.addShape.tap()
  await editor.screen.getByRole('menuitem', name).tap()
}

export async function blurActiveControl(browser: Browser) {
  await browser.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    return null
  })
}

export async function getInspectorRoot(editor: Editor) {
  if (editor.desktop) return editor.browser.locator('aside.inspector')

  const drawer = editor.screen.getByRole('dialog')
  if (!(await drawer.isVisible())) await editor.screen.getByRole('button', 'Settings').tap()
  await drawer.waitFor()
  return drawer
}

export async function openExactMeasures(inspector: Locator, browser: Browser) {
  const toggle = inspector.getByRole('button', /Exact measurements/i)
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.tap()
    await blurActiveControl(browser)
  }
  await measureInput(inspector, 'X').waitFor()
}

type MeasureField = 'X' | 'Y' | 'Width' | 'Height' | 'Length'

export function measureInput(inspector: Locator, label: MeasureField) {
  return inspector.getByLabel(new RegExp(`^${label}\\s*mm$`, 'i'))
}

export async function closeMobileDrawer(editor: Editor) {
  if (editor.desktop) return
  const drawer = editor.screen.getByRole('dialog')
  await editor.browser.keyboard.press('Escape')
  await drawer.waitFor({ state: 'hidden' })
  await waitForKonvaFrame(editor.browser)
}

export async function readMeasures(editor: Editor, isLine = false) {
  const inspector = await getInspectorRoot(editor)
  await openExactMeasures(inspector, editor.browser)
  const read = async (field: MeasureField) =>
    Number.parseFloat(await measureInput(inspector, field).inputValue())
  const measures = {
    x: await read('X'),
    y: await read('Y'),
    width: await read(isLine ? 'Length' : 'Width'),
    height: isLine ? undefined : await read('Height')
  }
  await closeMobileDrawer(editor)
  return measures
}

export async function addTextAndCommit(editor: Editor, text: string) {
  await editor.addText.tap()
  const field = editor.screen.getByRole('textbox', 'Edit the zine text')
  await field.fill(text)
  if (editor.desktop) await field.press('ControlOrMeta+Enter')
  else await blurActiveControl(editor.browser)
  await field.waitFor({ state: 'hidden' })
  await waitForKonvaFrame(editor.browser)
}

export async function selectedTextCenter(editor: Editor) {
  const box = await readMeasures(editor)
  return pagePoint(editor, mmToUnits(box.x + box.width / 2), mmToUnits(box.y + box.height! / 2))
}

export async function editSelectedText(editor: Editor) {
  if (editor.desktop) await editor.browser.keyboard.press('Enter')
  else await tapCanvas(editor, await selectedTextCenter(editor), true)
}

export async function setShapeFill(editor: Editor, color: 'Orange' | 'Blue') {
  const inspector = await getInspectorRoot(editor)
  await inspector.getByRole('radiogroup', 'Shape fill').getByRole('radio', color).check()
  await closeMobileDrawer(editor)
  await waitForKonvaFrame(editor.browser)
}

export function rotationSlider(inspector: Locator) {
  return inspector.getByRole('slider', /^Rotation/i)
}

export async function readRotationDegrees(editor: Editor) {
  const inspector = await getInspectorRoot(editor)
  const value = Number.parseFloat(await rotationSlider(inspector).inputValue())
  await closeMobileDrawer(editor)
  return value
}

export async function uploadBluePhoto(editor: Editor) {
  await editor.browser.locator('input[type="file"]').setInputFiles('tests/fixtures/blue-600x300.png')
  await editor.browser.locator('aside.inspector').getByText('blue-600x300.png', { exact: false }).waitFor()
  await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(editor, PAGE_W / 2, PAGE_H / 2), '#2f5bea')).toBe(true)
}

export async function setMeasureValue(editor: Editor, label: 'X' | 'Y', valueMm: number) {
  const inspector = await getInspectorRoot(editor)
  await openExactMeasures(inspector, editor.browser)
  const input = measureInput(inspector, label)
  await input.fill(String(valueMm))
  await input.press('Enter')
  await blurActiveControl(editor.browser)
}
