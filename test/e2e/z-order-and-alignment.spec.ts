import { expect, test } from './fixtures'
import {
  PAGE_H,
  PAGE_W,
  PANEL_H_MM,
  PANEL_W_MM,
  SAFE_MARGIN_MM,
  isPixelCloseTo,
  pagePoint,
  readCanvasPixel,
  round1,
  waitForKonvaFrame
} from './helpers/canvas'
import {
  addShape,
  deselectOnCanvas,
  getInspectorRoot,
  openEnglishEditor,
  openExactMeasures,
  readMeasures,
  readRotationDegrees,
  setMeasureValue,
  setRotationDegrees,
  setShapeFill,
  uploadSyntheticImage
} from './helpers/editor'

const ORANGE_HEX = '#d25a36'
const BLUE_HEX = '#2f5bea'

// ElementInspector displays values rounded to 0.1 mm; IEEE-754 midpoints like 32.25 mm
// can round to either 32.2 or 32.3 after unit round-tripping.
function expectMmCloseTo(actual: number, expected: number, tolerance = 0.15) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

test.describe('z-order, fit/fill, and page alignment', () => {
  test('flips painted center pixel colors with Send Backward and Bring Forward', async ({ page, isMobile }) => {
    await openEnglishEditor(page)

    // Stack two identical centered rectangles: Orange underneath, Blue on top.
    await addShape(page, 'Rectangle', isMobile)
    await setShapeFill(page, 'Orange', isMobile)

    // On mobile, MobileBar swaps "+ Shape" for selection actions while an element is selected.
    if (isMobile) {
      await deselectOnCanvas(page, true)
    }

    await addShape(page, 'Rectangle', isMobile)
    await setShapeFill(page, 'Blue', isMobile)

    const centerX = PAGE_W / 2
    const centerY = PAGE_H / 2

    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(page, centerX, centerY), BLUE_HEX)).toBe(true)

    if (isMobile) {
      await page.getByRole('button', { name: 'Backward' }).click()
    } else {
      await page.locator('aside.inspector').getByRole('button', { name: 'Backward' }).click()
    }

    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(page, centerX, centerY), ORANGE_HEX)).toBe(true)

    if (isMobile) {
      await page.getByRole('button', { name: 'Forward' }).click()
    } else {
      await page.locator('aside.inspector').getByRole('button', { name: 'Forward' }).click()
    }

    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(page, centerX, centerY), BLUE_HEX)).toBe(true)
  })

  test.describe('fit/fill and rotated painted-bounds alignment (desktop)', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop inspector alignment suite')

    test('applies Fill, Fit, and Center to photos and paper patterns', async ({ page }) => {
      await openEnglishEditor(page)
      const inspector = await getInspectorRoot(page, false)

      // 600x300 landscape photo (2:1 aspect ratio)
      await uploadSyntheticImage(page, { width: 600, height: 300, color: BLUE_HEX })

      // Fill ("cover"): matches full page height (105 mm), width = 210 mm, centered horizontally, rotation reset.
      await setRotationDegrees(inspector, 30)
      expect(await readRotationDegrees(page)).toBe(30)

      await inspector.getByRole('button', { name: 'Fill' }).click()
      expect(await readRotationDegrees(page)).toBe(0)

      const filledPhoto = await readMeasures(page)
      expect(filledPhoto.height).toBeCloseTo(PANEL_H_MM, 0)
      expect(filledPhoto.width).toBeCloseTo(PANEL_H_MM * 2, 0)
      expect(filledPhoto.y).toBeCloseTo(0, 1)
      expect(filledPhoto.x).toBeCloseTo(round1((PANEL_W_MM - PANEL_H_MM * 2) / 2), 0)

      // Fit ("contain"): matches full page width (74.25 mm), height = 37.125 mm, vertically centered.
      await setRotationDegrees(inspector, -25)
      await inspector.getByRole('button', { name: 'Fit' }).click()
      expect(await readRotationDegrees(page)).toBe(0)

      const fittedPhoto = await readMeasures(page)
      expect(fittedPhoto.width).toBeCloseTo(round1(PANEL_W_MM), 1)
      expect(fittedPhoto.height).toBeCloseTo(round1(PANEL_W_MM / 2), 1)
      expect(fittedPhoto.x).toBeCloseTo(0, 1)
      expect(fittedPhoto.y).toBeCloseTo(round1((PANEL_H_MM - PANEL_W_MM / 2) / 2), 1)

      // Move off-center, then click Center.
      await setMeasureValue(inspector, 'Y', 10)
      expect((await readMeasures(page)).y).toBeCloseTo(10, 1)

      await inspector.getByRole('button', { name: 'Center', exact: true }).click()
      const centeredPhoto = await readMeasures(page)
      expect(centeredPhoto.x).toBeCloseTo(0, 1)
      expect(centeredPhoto.y).toBeCloseTo(round1((PANEL_H_MM - PANEL_W_MM / 2) / 2), 1)

      // Switch to Page 1 and apply the Lined paper layout to verify Paper Fill / Fit bounds.
      await page.getByTestId('page-tile-p1').click()
      await inspector.getByRole('button', { name: 'Add Lined to page 1' }).click()
      await waitForKonvaFrame(page)

      // Click center of the lined paper block to select it.
      const paperCenter = await pagePoint(page, PAGE_W / 2, PAGE_H / 2)
      await page.mouse.click(paperCenter.x, paperCenter.y)
      await expect(inspector.getByRole('heading', { level: 2, name: 'Paper' })).toBeVisible()

      // Fill: edge-to-edge (0, 0, 74.3 x 105 mm), which disables horizontal & vertical alignment buttons.
      await inspector.getByRole('button', { name: 'Fill' }).click()
      const filledPaper = await readMeasures(page)
      expect(filledPaper.x).toBeCloseTo(0, 1)
      expect(filledPaper.y).toBeCloseTo(0, 1)
      expect(filledPaper.width).toBeCloseTo(round1(PANEL_W_MM), 1)
      expect(filledPaper.height).toBeCloseTo(PANEL_H_MM, 1)

      await openExactMeasures(inspector)
      await expect(inspector.getByRole('button', { name: 'Snap to the left of the page' })).toBeDisabled()
      await expect(inspector.getByRole('button', { name: 'Snap to the top of the page' })).toBeDisabled()

      // Fit: inside the 5 mm safe margin (5, 5, 64.3 x 95 mm).
      await inspector.getByRole('button', { name: 'Fit' }).click()
      const fittedPaper = await readMeasures(page)
      expect(fittedPaper.x).toBeCloseTo(SAFE_MARGIN_MM, 1)
      expect(fittedPaper.y).toBeCloseTo(SAFE_MARGIN_MM, 1)
      expect(fittedPaper.width).toBeCloseTo(round1(PANEL_W_MM - SAFE_MARGIN_MM * 2), 1)
      expect(fittedPaper.height).toBeCloseTo(PANEL_H_MM - SAFE_MARGIN_MM * 2, 1)
      await expect(inspector.getByRole('button', { name: 'Snap to the left of the page' })).toBeEnabled()
    })

    test('aligns stroked shapes using painted bounds at 0°, 90°, and 45° rotations', async ({ page }) => {
      await openEnglishEditor(page)
      const inspector = await getInspectorRoot(page, false)

      // Default rectangle is 40 x 30 mm. Give it a thick 4 mm border (half-stroke = 2 mm)
      // and Orange fill so painted bounds clearly differ from raw x/y box bounds.
      await addShape(page, 'Rectangle', false)
      await setShapeFill(page, 'Orange', false)

      const thicknessInput = inspector
        .locator('label.ed-field')
        .filter({ has: page.locator('.ed-field-label', { hasText: /^Thickness$/ }) })
        .locator('input')
      await thicknessInput.fill('4')
      await thicknessInput.press('Enter')
      await thicknessInput.blur()

      await openExactMeasures(inspector)

      const snapLeft = inspector.getByRole('button', { name: 'Snap to the left of the page' })
      const snapCenterH = inspector.getByRole('button', { name: 'Center horizontally' })
      const snapRight = inspector.getByRole('button', { name: 'Snap to the right of the page' })
      const snapTop = inspector.getByRole('button', { name: 'Snap to the top of the page' })
      const snapMiddleV = inspector.getByRole('button', { name: 'Center vertically' })
      const snapBottom = inspector.getByRole('button', { name: 'Snap to the bottom of the page' })

      // 0° rotation: painted box extends 2 mm outside [x, x+40] x [y, y+30].
      await snapLeft.click()
      await expect(snapLeft).toHaveAttribute('aria-pressed', 'true')
      expectMmCloseTo((await readMeasures(page)).x, 2)

      await snapRight.click()
      await expect(snapRight).toHaveAttribute('aria-pressed', 'true')
      expectMmCloseTo((await readMeasures(page)).x, PANEL_W_MM - 40 - 2)

      await snapCenterH.click()
      expectMmCloseTo((await readMeasures(page)).x, (PANEL_W_MM - 40) / 2)

      await snapTop.click()
      expectMmCloseTo((await readMeasures(page)).y, 2)

      await snapBottom.click()
      expectMmCloseTo((await readMeasures(page)).y, PANEL_H_MM - 30 - 2)

      await snapMiddleV.click()
      expectMmCloseTo((await readMeasures(page)).y, (PANEL_H_MM - 30) / 2)

      // 90° rotation around top-left corner: painted width = 34 mm (x-32 .. x+2),
      // painted height = 44 mm (y-2 .. y+42).
      await setRotationDegrees(inspector, 90)
      expect(await readRotationDegrees(page)).toBe(90)

      await snapLeft.click()
      await snapTop.click()
      const at90TopLeft = await readMeasures(page)
      expectMmCloseTo(at90TopLeft.x, 32)
      expectMmCloseTo(at90TopLeft.y, 2)

      await snapRight.click()
      await snapBottom.click()
      const at90BottomRight = await readMeasures(page)
      expectMmCloseTo(at90BottomRight.x, PANEL_W_MM - 34 + 32)
      expectMmCloseTo(at90BottomRight.y, PANEL_H_MM - 44 + 2)

      // 45° rotation: painted left offset = 34 * sqrt(2)/2 = 24.04 mm,
      // painted top offset = 4 * sqrt(2)/2 = 2.83 mm.
      await setRotationDegrees(inspector, 45)
      expect(await readRotationDegrees(page)).toBe(45)

      await snapLeft.click()
      await snapTop.click()
      const at45 = await readMeasures(page)
      expectMmCloseTo(at45.x, 34 * Math.SQRT1_2)
      expectMmCloseTo(at45.y, 4 * Math.SQRT1_2)
    })
  })
})
