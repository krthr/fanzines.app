import { expect, type Locator, type Page } from '@playwright/test'
import { createSolidPngBuffer, pagePoint, waitForKonvaFrame } from './canvas'

export type ShapeMenuLabel = 'Rectangle' | 'Circle' | 'Line'

export type MeasureValues = {
  x: number
  y: number
  width: number
  height?: number
}

export async function openEnglishEditor(page: Page): Promise<void> {
  await page.goto('/en/editor')
  await expect(page.getByTestId('active-page')).toBeVisible()
  await waitForKonvaFrame(page)
}

export async function addShape(page: Page, shape: ShapeMenuLabel, isMobile: boolean): Promise<void> {
  if (isMobile) {
    await page.getByRole('button', { name: '+ Shape' }).click()
  } else {
    await page.locator('header.ed-topbar').getByRole('button', { name: 'Shape' }).click()
  }

  await page.getByRole('menuitem', { name: shape }).click()
  await waitForKonvaFrame(page)
}

export async function addTextAndCommit(
  page: Page,
  text: string,
  options: { isMobile?: boolean, commitBy?: 'shortcut' | 'blur' } = {}
): Promise<void> {
  if (options.isMobile) {
    await page.getByRole('button', { name: '+ Text' }).click()
  } else {
    await page.locator('header.ed-topbar').getByRole('button', { name: 'Text' }).click()
  }

  const editor = page.getByRole('textbox', { name: 'Edit the zine text' })
  await expect(editor).toBeVisible()
  await editor.fill(text)

  if (options.commitBy === 'blur' || options.isMobile) {
    await editor.blur()
  } else {
    await editor.press('ControlOrMeta+Enter')
  }

  await expect(editor).toBeHidden()
  await waitForKonvaFrame(page)
}

export async function uploadSyntheticImage(
  page: Page,
  options: { width: number, height: number, color: string, name?: string }
): Promise<void> {
  const buffer = createSolidPngBuffer(options.width, options.height, options.color)
  await page.locator('input[type="file"]').setInputFiles({
    name: options.name ?? `fixture-${options.width}x${options.height}.png`,
    mimeType: 'image/png',
    buffer
  })
  await waitForKonvaFrame(page)
}

export async function getInspectorRoot(page: Page, isMobile: boolean): Promise<Locator> {
  if (!isMobile) {
    const aside = page.locator('aside.inspector')
    await expect(aside).toBeVisible()
    return aside
  }

  const drawer = page.getByRole('dialog')
  if (!(await drawer.isVisible())) {
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(drawer).toBeVisible()
  }
  return drawer
}

export async function closeMobileDrawerIfOpen(page: Page, isMobile: boolean): Promise<void> {
  if (!isMobile) return

  const drawer = page.getByRole('dialog')
  if (await drawer.isVisible()) {
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await waitForKonvaFrame(page)
  }
}

export async function setShapeFill(page: Page, colorName: string, isMobile: boolean): Promise<void> {
  const inspector = await getInspectorRoot(page, isMobile)
  await inspector.getByRole('radiogroup', { name: 'Shape fill' }).locator(`label[title="${colorName}"]`).click()
  await closeMobileDrawerIfOpen(page, isMobile)
  await waitForKonvaFrame(page)
}

export async function openExactMeasures(inspector: Locator): Promise<void> {
  const toggle = inspector.getByRole('button', { name: /Exact measurements/ })
  await expect(toggle).toBeVisible()
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click()
    await toggle.blur()
  }
  await expect(inspector.locator('#ed-measures')).toBeVisible()
}

export async function deselectOnCanvas(page: Page, isMobile: boolean, corner = { x: 40, y: 40 }): Promise<void> {
  const point = await pagePoint(page, corner.x, corner.y)
  if (isMobile) {
    await page.touchscreen.tap(point.x, point.y)
  } else {
    await page.mouse.click(point.x, point.y)
  }
  await waitForKonvaFrame(page)
}

export function measureInput(inspector: Locator, label: 'X' | 'Y' | 'Width' | 'Height' | 'Length'): Locator {
  return inspector
    .locator('#ed-measures label.ed-field')
    .filter({ has: inspector.page().locator('.ed-field-label', { hasText: new RegExp(`^${label}$`) }) })
    .locator('input')
}

export async function readMeasures(
  page: Page,
  options: { isMobile?: boolean, isLine?: boolean, keepDrawerOpen?: boolean } = {}
): Promise<MeasureValues> {
  const isMobile = Boolean(options.isMobile)
  const inspector = await getInspectorRoot(page, isMobile)
  await openExactMeasures(inspector)

  const x = Number.parseFloat(await measureInput(inspector, 'X').inputValue())
  const y = Number.parseFloat(await measureInput(inspector, 'Y').inputValue())
  const width = Number.parseFloat(await measureInput(inspector, options.isLine ? 'Length' : 'Width').inputValue())
  const height = options.isLine
    ? undefined
    : Number.parseFloat(await measureInput(inspector, 'Height').inputValue())

  if (!options.keepDrawerOpen) {
    await closeMobileDrawerIfOpen(page, isMobile)
  }

  return { x, y, width, height }
}

export async function setMeasureValue(
  inspector: Locator,
  label: 'X' | 'Y' | 'Width' | 'Height' | 'Length',
  valueMm: number
): Promise<void> {
  await openExactMeasures(inspector)
  const input = measureInput(inspector, label)
  await input.fill(String(valueMm))
  await input.press('Enter')
  await input.blur()
}

export function rotationSlider(inspector: Locator): Locator {
  return inspector
    .locator('label.slider')
    .filter({ has: inspector.page().locator('.slider-label', { hasText: /^Rotation$/ }) })
    .locator('input[type="range"]')
}

export async function readRotationDegrees(
  page: Page,
  options: { isMobile?: boolean, isText?: boolean, keepDrawerOpen?: boolean } = {}
): Promise<number> {
  const isMobile = Boolean(options.isMobile)
  const inspector = await getInspectorRoot(page, isMobile)
  if (options.isText) {
    await openExactMeasures(inspector)
  }

  const slider = rotationSlider(inspector)
  await expect(slider).toBeVisible()
  const value = Number.parseFloat(await slider.inputValue())

  if (!options.keepDrawerOpen) {
    await closeMobileDrawerIfOpen(page, isMobile)
  }

  return value
}

export async function setRotationDegrees(
  inspector: Locator,
  degrees: number,
  options: { isText?: boolean } = {}
): Promise<void> {
  if (options.isText) {
    await openExactMeasures(inspector)
  }

  const slider = rotationSlider(inspector)
  await expect(slider).toBeVisible()
  await slider.evaluate((el: HTMLInputElement, deg: number) => {
    el.value = String(deg)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, degrees)
}
