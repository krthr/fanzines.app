import { expect } from 'e2e'
import {
  PAGE_H,
  PAGE_W,
  PANEL_H_MM,
  PANEL_W_MM,
  SAFE_MARGIN_MM,
  isPixelCloseTo,
  pagePoint,
  tapCanvas,
  readCanvasPixel,
  waitForKonvaFrame
} from './helpers/canvas'
import {
  test,
  addShape,
  blurActiveControl,
  getInspectorRoot,
  readMeasures,
  readRotationDegrees,
  setMeasureValue,
  rotationSlider,
  setShapeFill,
  uploadBluePhoto
} from './helpers/editor'

const ORANGE_HEX = '#d25a36'
const BLUE_HEX = '#2f5bea'

// ElementInspector displays values rounded to 0.1 mm; IEEE-754 midpoints like 32.25 mm
// can round to either 32.2 or 32.3 after unit round-tripping.
function expectMmCloseTo(actual: number, expected: number, tolerance = 0.15) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

test.describe('z-order, fit/fill, and page alignment', { requires: ['browser'] }, () => {
  test('flips painted center pixel colors with Send Backward and Bring Forward', async ({ openEditor, screen }) => {
    const editor = await openEditor()
    // Stack two identical centered rectangles: Orange underneath, Blue on top.
    await addShape(editor, 'Rectangle')
    await setShapeFill(editor, 'Orange')

    // On mobile, MobileBar swaps "+ Shape" for selection actions while an element is selected.
    if (!editor.desktop) {
      await tapCanvas(editor, await pagePoint(editor, 40, 40))
    }

    await addShape(editor, 'Rectangle')
    await setShapeFill(editor, 'Blue')

    const centerX = PAGE_W / 2
    const centerY = PAGE_H / 2

    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(editor, centerX, centerY), BLUE_HEX)).toBe(true)

    const actions = editor.desktop ? await getInspectorRoot(editor) : screen
    await actions.getByRole('button', 'Backward').tap()

    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(editor, centerX, centerY), ORANGE_HEX)).toBe(true)

    await actions.getByRole('button', 'Forward').tap()

    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(editor, centerX, centerY), BLUE_HEX)).toBe(true)
  })

  test.describe('fit/fill and rotated painted-bounds alignment (desktop)', () => {
    test.beforeEach(async ({ desktop }) => {
      test.skip(!desktop, 'Desktop inspector alignment suite')
    })

    test('applies Fill, Fit, and Position on the page to photos and paper patterns', async ({ openEditor, screen, browser }) => {
      const editor = await openEditor()
      const inspector = await getInspectorRoot(editor)

      // 600x300 landscape photo (2:1 aspect ratio)
      await uploadBluePhoto(editor)

      // Fill ("cover"): matches full page height (105 mm), width = 210 mm, centered horizontally, rotation reset.
      await rotationSlider(inspector).fill('30')
      expect(await readRotationDegrees(editor)).toBe(30)

      await inspector.getByRole('button', 'Fill').tap()
      expect(await readRotationDegrees(editor)).toBe(0)

      const filledPhoto = await readMeasures(editor)
      expectMmCloseTo(filledPhoto.height!, PANEL_H_MM)
      expectMmCloseTo(filledPhoto.width, PANEL_H_MM * 2)
      expectMmCloseTo(filledPhoto.y, 0)
      expectMmCloseTo(filledPhoto.x, (PANEL_W_MM - PANEL_H_MM * 2) / 2)

      // Fit ("contain"): matches full page width (74.25 mm), height = 37.125 mm, vertically centered.
      await rotationSlider(inspector).fill('-25')
      await inspector.getByRole('button', 'Fit').tap()
      expect(await readRotationDegrees(editor)).toBe(0)

      const fittedPhoto = await readMeasures(editor)
      expectMmCloseTo(fittedPhoto.width, PANEL_W_MM)
      expectMmCloseTo(fittedPhoto.height!, PANEL_W_MM / 2)
      expectMmCloseTo(fittedPhoto.x, 0)
      expectMmCloseTo(fittedPhoto.y, (PANEL_H_MM - PANEL_W_MM / 2) / 2)

      // Move off-center vertically, then re-center via the always-visible "Position on the page" group.
      await setMeasureValue(editor, 'Y', 10)
      expectMmCloseTo((await readMeasures(editor)).y, 10)

      await expect(inspector.getByRole('heading', /^Position on the page$/i, { level: 3 })).toBeVisible()
      await expect(inspector.getByRole('button', 'Center horizontally')).toBeDisabled()
      await inspector.getByRole('button', 'Center vertically').tap()
      const centeredPhoto = await readMeasures(editor)
      expectMmCloseTo(centeredPhoto.x, 0)
      expectMmCloseTo(centeredPhoto.y, (PANEL_H_MM - PANEL_W_MM / 2) / 2)

      // Switch to Page 1 and apply the Lined paper layout to verify Paper Fill / Fit bounds.
      await screen.getByTestId('page-tile-p1').tap()
      await inspector.getByRole('button', /Add Lined to page 1/i).tap()
      await waitForKonvaFrame(browser)

      // Click center of the lined paper block to select it.
      const paperCenter = await pagePoint(editor, PAGE_W / 2, PAGE_H / 2)
      await screen.tapAt(paperCenter)
      await expect(inspector.getByRole('heading', /^Paper$/i, { level: 2 })).toBeVisible()

      // Fill: edge-to-edge (0, 0, 74.25 x 105 mm), keeping "Position on the page" visible with disabled controls.
      await inspector.getByRole('button', 'Fill').tap()
      const filledPaper = await readMeasures(editor)
      expectMmCloseTo(filledPaper.x, 0)
      expectMmCloseTo(filledPaper.y, 0)
      expectMmCloseTo(filledPaper.width, PANEL_W_MM)
      expectMmCloseTo(filledPaper.height!, PANEL_H_MM)

      await expect(inspector.getByRole('heading', /^Position on the page$/i, { level: 3 })).toBeVisible()
      await expect(inspector.getByRole('button', 'Snap to the left of the page')).toBeDisabled()
      await expect(inspector.getByRole('button', 'Snap to the top of the page')).toBeDisabled()

      // Fit: inside the 5 mm safe margin (5, 5, 64.25 x 95 mm).
      await inspector.getByRole('button', 'Fit').tap()
      const fittedPaper = await readMeasures(editor)
      expectMmCloseTo(fittedPaper.x, SAFE_MARGIN_MM)
      expectMmCloseTo(fittedPaper.y, SAFE_MARGIN_MM)
      expectMmCloseTo(fittedPaper.width, PANEL_W_MM - SAFE_MARGIN_MM * 2)
      expectMmCloseTo(fittedPaper.height!, PANEL_H_MM - SAFE_MARGIN_MM * 2)
      await expect(inspector.getByRole('button', 'Snap to the left of the page')).toBeEnabled()
    })

    test('aligns stroked shapes using painted bounds at 0°, 90°, and 45° rotations', async ({ openEditor, browser }) => {
      const editor = await openEditor()
      const inspector = await getInspectorRoot(editor)

      // Default rectangle is 40 x 30 mm. Give it a thick 4 mm border (half-stroke = 2 mm)
      // and Orange fill so painted bounds clearly differ from raw x/y box bounds.
      await addShape(editor, 'Rectangle')
      await setShapeFill(editor, 'Orange')

      const thicknessInput = inspector.getByLabel(/^Thickness\s*mm$/i)
      await thicknessInput.fill('4')
      await thicknessInput.press('Enter')
      await blurActiveControl(browser)

      const snapLeft = inspector.getByRole('button', 'Snap to the left of the page')
      const snapCenterH = inspector.getByRole('button', 'Center horizontally')
      const snapRight = inspector.getByRole('button', 'Snap to the right of the page')
      const snapTop = inspector.getByRole('button', 'Snap to the top of the page')
      const snapMiddleV = inspector.getByRole('button', 'Center vertically')
      const snapBottom = inspector.getByRole('button', 'Snap to the bottom of the page')

      // 0° rotation: painted box extends 2 mm outside [x, x+40] x [y, y+30].
      await snapLeft.tap()
      await expect(snapLeft).toHaveAttribute('aria-pressed', 'true')
      expectMmCloseTo((await readMeasures(editor)).x, 2)

      await snapRight.tap()
      await expect(snapRight).toHaveAttribute('aria-pressed', 'true')
      expectMmCloseTo((await readMeasures(editor)).x, PANEL_W_MM - 40 - 2)

      await snapCenterH.tap()
      expectMmCloseTo((await readMeasures(editor)).x, (PANEL_W_MM - 40) / 2)

      await snapTop.tap()
      expectMmCloseTo((await readMeasures(editor)).y, 2)

      await snapBottom.tap()
      expectMmCloseTo((await readMeasures(editor)).y, PANEL_H_MM - 30 - 2)

      await snapMiddleV.tap()
      expectMmCloseTo((await readMeasures(editor)).y, (PANEL_H_MM - 30) / 2)

      // 90° rotation around top-left corner: painted width = 34 mm (x-32 .. x+2),
      // painted height = 44 mm (y-2 .. y+42).
      await rotationSlider(inspector).fill('90')
      expect(await readRotationDegrees(editor)).toBe(90)

      await snapLeft.tap()
      await snapTop.tap()
      const at90TopLeft = await readMeasures(editor)
      expectMmCloseTo(at90TopLeft.x, 32)
      expectMmCloseTo(at90TopLeft.y, 2)

      await snapRight.tap()
      await snapBottom.tap()
      const at90BottomRight = await readMeasures(editor)
      expectMmCloseTo(at90BottomRight.x, PANEL_W_MM - 34 + 32)
      expectMmCloseTo(at90BottomRight.y, PANEL_H_MM - 44 + 2)

      // 45° rotation: painted left offset = 34 * sqrt(2)/2 = 24.04 mm,
      // painted top offset = 4 * sqrt(2)/2 = 2.83 mm.
      await rotationSlider(inspector).fill('45')
      expect(await readRotationDegrees(editor)).toBe(45)

      await snapLeft.tap()
      await snapTop.tap()
      const at45 = await readMeasures(editor)
      expectMmCloseTo(at45.x, 34 * Math.SQRT1_2)
      expectMmCloseTo(at45.y, 4 * Math.SQRT1_2)
    })
  })
})
