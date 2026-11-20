import { expect, test } from './fixtures'
import {
  PAGE_H,
  PAGE_W,
  dragBetween,
  dragPagePoints,
  isPixelCloseTo,
  mmToUnits,
  pagePoint,
  readCanvasPixel,
  transformerHandlePoint,
  unitsToMm
} from './helpers/canvas'
import {
  addShape,
  addTextAndCommit,
  openEnglishEditor,
  readMeasures,
  readRotationDegrees,
  setShapeFill,
  uploadSyntheticImage
} from './helpers/editor'

const ORANGE_HEX = '#d25a36'

test.describe('canvas drag, resize, and rotate', () => {
  test('drags an element on canvas and updates exact-measure inspector x/y (mm)', async ({ page, isMobile }) => {
    await openEnglishEditor(page)

    await addShape(page, 'Rectangle', isMobile)
    await setShapeFill(page, 'Orange', isMobile)

    const before = await readMeasures(page, { isMobile })
    expect(before.width).toBeCloseTo(40, 0)
    expect(before.height).toBeCloseTo(30, 0)

    const deltaXUnits = 160
    const deltaYUnits = 220

    // Drag the filled rectangle from its center by (deltaXUnits, deltaYUnits).
    await dragPagePoints(
      page,
      { x: PAGE_W / 2, y: PAGE_H / 2 },
      { x: PAGE_W / 2 + deltaXUnits, y: PAGE_H / 2 + deltaYUnits },
      { touch: isMobile }
    )

    const after = await readMeasures(page, { isMobile })
    expect(after.x - before.x).toBeGreaterThan(unitsToMm(deltaXUnits) - 2.5)
    expect(after.x - before.x).toBeLessThan(unitsToMm(deltaXUnits) + 2.5)
    expect(after.y - before.y).toBeGreaterThan(unitsToMm(deltaYUnits) - 2.5)
    expect(after.y - before.y).toBeLessThan(unitsToMm(deltaYUnits) + 2.5)

    // Verify actual Konva canvas painting moved to the new center.
    const newCenterX = mmToUnits(after.x + after.width / 2)
    const newCenterY = mmToUnits(after.y + (after.height ?? 0) / 2)
    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(page, newCenterX, newCenterY), ORANGE_HEX)).toBe(true)
  })

  test('drags the Konva rotation handle (rotater) and updates rotation degrees in the inspector', async ({ page, isMobile }) => {
    await openEnglishEditor(page)

    await addShape(page, 'Rectangle', isMobile)
    await setShapeFill(page, 'Orange', isMobile)

    const initialRotation = await readRotationDegrees(page, { isMobile })
    expect(initialRotation).toBe(0)

    const box = await readMeasures(page, { isMobile })
    const rectUnits = {
      x: mmToUnits(box.x),
      y: mmToUnits(box.y),
      width: mmToUnits(box.width),
      height: mmToUnits(box.height ?? 30)
    }

    const rotater = await transformerHandlePoint(page, rectUnits, 'rotater', { compact: isMobile })
    const center = await pagePoint(page, rectUnits.x + rectUnits.width / 2, rectUnits.y + rectUnits.height / 2)
    const radius = center.y - rotater.y

    // Sweep the rotater handle ~90 degrees clockwise to the right of the center.
    await dragBetween(
      page,
      rotater,
      { x: center.x + radius, y: center.y },
      { steps: 16, touch: isMobile }
    )

    await expect.poll(async () => readRotationDegrees(page, { isMobile })).toBeGreaterThan(45)
    const updatedRotation = await readRotationDegrees(page, { isMobile })
    expect(updatedRotation).toBeLessThan(125)
  })

  test.describe('resize handle constraints (desktop)', () => {
    test.skip(({ isMobile }) => isMobile, 'Desktop resize handle matrix')

    test('keeps image aspect ratio on corner drag and omits side handles', async ({ page }) => {
      await openEnglishEditor(page)

      // 600x300 -> 2:1 aspect ratio, fits inside the 10% margin without downscaling.
      await uploadSyntheticImage(page, { width: 600, height: 300, color: '#2f5bea' })

      const before = await readMeasures(page)
      const initialRatio = before.width / (before.height ?? 1)
      expect(initialRatio).toBeCloseTo(2, 1)

      const boxUnits = {
        x: mmToUnits(before.x),
        y: mmToUnits(before.y),
        width: mmToUnits(before.width),
        height: mmToUnits(before.height ?? 0)
      }

      // Drag bottom-right corner with an intentionally skewed delta (+150 X, +15 Y):
      // keepRatio: true should preserve the 2:1 proportion.
      const brHandle = await transformerHandlePoint(page, boxUnits, 'bottom-right')
      const brTarget = await pagePoint(page, boxUnits.x + boxUnits.width + 150, boxUnits.y + boxUnits.height + 15)
      await dragBetween(page, brHandle, brTarget)

      const afterCorner = await readMeasures(page)
      expect(afterCorner.width).toBeGreaterThan(before.width + 5)
      expect(afterCorner.height!).toBeGreaterThan(before.height! + 2)
      expect(afterCorner.width / afterCorner.height!).toBeCloseTo(initialRatio, 1)

      // Dragging the middle-right edge (not an enabled anchor on images) drags the image
      // instead of resizing it horizontally.
      const afterUnits = {
        x: mmToUnits(afterCorner.x),
        y: mmToUnits(afterCorner.y),
        width: mmToUnits(afterCorner.width),
        height: mmToUnits(afterCorner.height ?? 0)
      }
      const mrEdge = await transformerHandlePoint(page, afterUnits, 'middle-right')
      await dragBetween(page, { x: mrEdge.x - 4, y: mrEdge.y }, { x: mrEdge.x + 30, y: mrEdge.y })

      const afterSide = await readMeasures(page)
      expect(afterSide.width).toBeCloseTo(afterCorner.width, 1)
      expect(afterSide.height!).toBeCloseTo(afterCorner.height!, 1)
      expect(afterSide.x).toBeGreaterThan(afterCorner.x + 2)
    })

    test('keeps circle round on corner drag and turns it into an ellipse on side drag', async ({ page }) => {
      await openEnglishEditor(page)

      await addShape(page, 'Circle', false)
      const before = await readMeasures(page)
      expect(before.width).toBeCloseTo(30, 0)
      expect(before.height).toBeCloseTo(30, 0)

      const beforeUnits = {
        x: mmToUnits(before.x),
        y: mmToUnits(before.y),
        width: mmToUnits(before.width),
        height: mmToUnits(before.height ?? 30)
      }

      // Corner drag with non-square delta (+160 X, +30 Y): keepRatio keeps width === height.
      const br = await transformerHandlePoint(page, beforeUnits, 'bottom-right')
      const brTarget = await pagePoint(page, beforeUnits.x + beforeUnits.width + 160, beforeUnits.y + beforeUnits.height + 30)
      await dragBetween(page, br, brTarget)

      const afterCorner = await readMeasures(page)
      expect(afterCorner.width).toBeGreaterThan(before.width + 5)
      expect(Math.abs(afterCorner.width - afterCorner.height!)).toBeLessThanOrEqual(0.3)

      // Side handle drag (+140 X): stretches width only, turning circle into an ellipse.
      const cornerUnits = {
        x: mmToUnits(afterCorner.x),
        y: mmToUnits(afterCorner.y),
        width: mmToUnits(afterCorner.width),
        height: mmToUnits(afterCorner.height ?? 30)
      }
      const mr = await transformerHandlePoint(page, cornerUnits, 'middle-right')
      const mrTarget = await pagePoint(page, cornerUnits.x + cornerUnits.width + 140, cornerUnits.y + cornerUnits.height / 2)
      await dragBetween(page, mr, mrTarget)

      const afterSide = await readMeasures(page)
      expect(afterSide.width).toBeGreaterThan(afterCorner.width + 6)
      expect(afterSide.height!).toBeCloseTo(afterCorner.height!, 1)
    })

    test('resizes text and lines width-only via side handles', async ({ page }) => {
      await openEnglishEditor(page)

      // Short single-line text so narrowing does not wrap onto a second line.
      await addTextAndCommit(page, 'Zine')
      const textBefore = await readMeasures(page)

      const textUnits = {
        x: mmToUnits(textBefore.x),
        y: mmToUnits(textBefore.y),
        width: mmToUnits(textBefore.width),
        height: mmToUnits(textBefore.height ?? 0)
      }

      // Drag middle-right handle inward by -220 units: width shrinks, height stays constant.
      const textMr = await transformerHandlePoint(page, textUnits, 'middle-right')
      const textMrTarget = await pagePoint(page, textUnits.x + textUnits.width - 220, textUnits.y + textUnits.height / 2)
      await dragBetween(page, textMr, textMrTarget)

      const textAfter = await readMeasures(page)
      expect(textAfter.width).toBeLessThan(textBefore.width - 10)
      expect(textAfter.height!).toBeCloseTo(textBefore.height!, 1)

      // Add a Line: inspector exposes Length (no Height), and side handle changes length only.
      await addShape(page, 'Line', false)
      const lineBefore = await readMeasures(page, { isLine: true })
      expect(lineBefore.width).toBeCloseTo(50, 0)

      const lineUnits = {
        x: mmToUnits(lineBefore.x),
        y: mmToUnits(lineBefore.y),
        width: mmToUnits(lineBefore.width),
        height: 0
      }

      const lineMr = await transformerHandlePoint(page, lineUnits, 'middle-right')
      const lineMrTarget = await pagePoint(page, lineUnits.x + lineUnits.width + 140, lineUnits.y)
      await dragBetween(page, lineMr, lineMrTarget)

      const lineAfter = await readMeasures(page, { isLine: true })
      expect(lineAfter.width).toBeGreaterThan(lineBefore.width + 7)
      expect(lineAfter.y).toBeCloseTo(lineBefore.y, 1)
    })
  })
})
