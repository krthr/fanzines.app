import { expect } from 'e2e'
import {
  PAGE_H,
  PAGE_W,
  type ElementBox,
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
  test,
  addShape,
  addTextAndCommit,
  getInspectorRoot,
  readMeasures,
  readRotationDegrees,
  rotationSlider,
  setShapeFill,
  uploadBluePhoto
} from './helpers/editor'

const ORANGE_HEX = '#d25a36'

function measuresToUnitsBox(measures: Awaited<ReturnType<typeof readMeasures>>): ElementBox {
  return {
    x: mmToUnits(measures.x),
    y: mmToUnits(measures.y),
    width: mmToUnits(measures.width),
    height: mmToUnits(measures.height ?? 0)
  }
}

test.describe('canvas drag, resize, and rotate', { requires: ['browser'] }, () => {
  test('drags an element on canvas and updates exact-measure inspector x/y (mm)', async ({ openEditor }) => {
    const editor = await openEditor()
    await addShape(editor, 'Rectangle')
    await setShapeFill(editor, 'Orange')

    const before = await readMeasures(editor)
    expect(before.width).toBeCloseTo(40, 0)
    expect(before.height).toBeCloseTo(30, 0)

    const deltaXUnits = 160
    const deltaYUnits = 220

    // Drag the filled rectangle from its center by (deltaXUnits, deltaYUnits).
    await dragPagePoints(
      editor,
      { x: PAGE_W / 2, y: PAGE_H / 2 },
      { x: PAGE_W / 2 + deltaXUnits, y: PAGE_H / 2 + deltaYUnits }
    )

    const after = await readMeasures(editor)
    expect(after.x - before.x).toBeGreaterThan(unitsToMm(deltaXUnits) - 2.5)
    expect(after.x - before.x).toBeLessThan(unitsToMm(deltaXUnits) + 2.5)
    expect(after.y - before.y).toBeGreaterThan(unitsToMm(deltaYUnits) - 2.5)
    expect(after.y - before.y).toBeLessThan(unitsToMm(deltaYUnits) + 2.5)

    // Verify actual Konva canvas painting moved to the new center.
    const newCenterX = mmToUnits(after.x + after.width / 2)
    const newCenterY = mmToUnits(after.y + (after.height ?? 0) / 2)
    await expect.poll(async () => isPixelCloseTo(await readCanvasPixel(editor, newCenterX, newCenterY), ORANGE_HEX)).toBe(true)
  })

  test('drags the Konva rotation handle (rotater) and updates rotation degrees in the inspector', async ({ openEditor }) => {
    const editor = await openEditor()
    await addShape(editor, 'Rectangle')
    await setShapeFill(editor, 'Orange')

    const initialRotation = await readRotationDegrees(editor)
    expect(initialRotation).toBe(0)

    const rectUnits = measuresToUnitsBox(await readMeasures(editor))
    const rotater = await transformerHandlePoint(editor, rectUnits, 'rotater')
    const center = await pagePoint(editor, rectUnits.x + rectUnits.width / 2, rectUnits.y + rectUnits.height / 2)
    const radius = center.y - rotater.y

    // Sweep the rotater handle ~90 degrees clockwise to the right of the center.
    await dragBetween(
      editor,
      rotater,
      { x: center.x + radius, y: center.y },
      16
    )

    // Open the inspector once before polling so mobile UDrawer does not toggle on every tick.
    const inspector = await getInspectorRoot(editor)
    const slider = rotationSlider(inspector)
    await expect(slider).toBeVisible()
    await expect.poll(async () => Number.parseFloat(await slider.inputValue())).toBeGreaterThan(45)
    expect(Number.parseFloat(await slider.inputValue())).toBeLessThan(125)
  })

  test('keeps circle round on corner drag and turns it into an ellipse on side drag', async ({ openEditor }) => {
    const editor = await openEditor()
    await addShape(editor, 'Circle')
    const before = await readMeasures(editor)
    expect(before.width).toBeCloseTo(30, 0)
    expect(before.height).toBeCloseTo(30, 0)

    const beforeUnits = measuresToUnitsBox(before)

    // Corner drag with non-square delta (+160 X, +30 Y): keepRatio keeps width === height.
    const br = await transformerHandlePoint(editor, beforeUnits, 'bottom-right')
    const brTarget = await pagePoint(editor, beforeUnits.x + beforeUnits.width + 160, beforeUnits.y + beforeUnits.height + 30)
    await dragBetween(editor, br, brTarget)

    const afterCorner = await readMeasures(editor)
    expect(afterCorner.width).toBeGreaterThan(before.width + 5)
    expect(Math.abs(afterCorner.width - afterCorner.height!)).toBeLessThanOrEqual(0.3)

    // Side handle drag (+140 X): stretches width only, turning circle into an ellipse.
    const cornerUnits = measuresToUnitsBox(afterCorner)
    const mr = await transformerHandlePoint(editor, cornerUnits, 'middle-right')
    const mrTarget = await pagePoint(editor, cornerUnits.x + cornerUnits.width + 140, cornerUnits.y + cornerUnits.height / 2)
    await dragBetween(editor, mr, mrTarget)

    const afterSide = await readMeasures(editor)
    expect(afterSide.width).toBeGreaterThan(afterCorner.width + 6)
    expect(afterSide.height!).toBeCloseTo(afterCorner.height!, 1)
  })

  test.describe('resize handle constraints (desktop)', () => {
    test.beforeEach(async ({ desktop }) => {
      test.skip(!desktop, 'Desktop resize handle matrix')
    })

    test('keeps image aspect ratio on corner drag and omits side handles', async ({ openEditor }) => {
      const editor = await openEditor()
      // 600x300 -> 2:1 aspect ratio, fits inside the 10% margin without downscaling.
      await uploadBluePhoto(editor)

      const before = await readMeasures(editor)
      const initialRatio = before.width / (before.height ?? 1)
      expect(initialRatio).toBeCloseTo(2, 1)

      const boxUnits = measuresToUnitsBox(before)

      // Drag bottom-right corner with an intentionally skewed delta (+150 X, +15 Y):
      // keepRatio: true should preserve the 2:1 proportion.
      const brHandle = await transformerHandlePoint(editor, boxUnits, 'bottom-right')
      const brTarget = await pagePoint(editor, boxUnits.x + boxUnits.width + 150, boxUnits.y + boxUnits.height + 15)
      await dragBetween(editor, brHandle, brTarget)

      const afterCorner = await readMeasures(editor)
      expect(afterCorner.width).toBeGreaterThan(before.width + 5)
      expect(afterCorner.height!).toBeGreaterThan(before.height! + 2)
      expect(afterCorner.width / afterCorner.height!).toBeCloseTo(initialRatio, 1)

      // Dragging the middle-right edge (not an enabled anchor on images) drags the image
      // instead of resizing it horizontally.
      const afterUnits = measuresToUnitsBox(afterCorner)
      const mrEdge = await transformerHandlePoint(editor, afterUnits, 'middle-right')
      await dragBetween(editor, { x: mrEdge.x - 4, y: mrEdge.y }, { x: mrEdge.x + 30, y: mrEdge.y })

      const afterSide = await readMeasures(editor)
      expect(afterSide.width).toBeCloseTo(afterCorner.width, 1)
      expect(afterSide.height!).toBeCloseTo(afterCorner.height!, 1)
      expect(afterSide.x).toBeGreaterThan(afterCorner.x + 2)
    })

    test('resizes text and lines width-only via side handles and omits corner handles', async ({ openEditor }) => {
      const editor = await openEditor()
      // Short single-line text so narrowing does not wrap onto a second line.
      await addTextAndCommit(editor, 'Zine')
      const textBefore = await readMeasures(editor)
      const textUnits = measuresToUnitsBox(textBefore)

      // Drag middle-right handle inward by -220 units: width shrinks, height stays constant.
      const textMr = await transformerHandlePoint(editor, textUnits, 'middle-right')
      const textMrTarget = await pagePoint(editor, textUnits.x + textUnits.width - 220, textUnits.y + textUnits.height / 2)
      await dragBetween(editor, textMr, textMrTarget)

      const textAfterSide = await readMeasures(editor)
      expect(textAfterSide.width).toBeLessThan(textBefore.width - 10)
      expect(textAfterSide.height!).toBeCloseTo(textBefore.height!, 1)

      // Dragging the bottom-right corner (not an enabled anchor on text) drags the element
      // instead of resizing its height or width.
      const afterTextUnits = measuresToUnitsBox(textAfterSide)
      const textBr = await transformerHandlePoint(editor, afterTextUnits, 'bottom-right')
      await dragBetween(editor, { x: textBr.x - 4, y: textBr.y - 4 }, { x: textBr.x + 30, y: textBr.y + 45 })

      const textAfterCorner = await readMeasures(editor)
      expect(textAfterCorner.width).toBeCloseTo(textAfterSide.width, 1)
      expect(textAfterCorner.height!).toBeCloseTo(textAfterSide.height!, 1)
      expect(textAfterCorner.y).toBeGreaterThan(textAfterSide.y + 4)

      // Add a Line: inspector exposes Length (no Height), and side handle changes length only.
      await addShape(editor, 'Line')
      const lineBefore = await readMeasures(editor, true)
      expect(lineBefore.width).toBeCloseTo(50, 0)

      const lineUnits = measuresToUnitsBox(lineBefore)
      const lineMr = await transformerHandlePoint(editor, lineUnits, 'middle-right')
      const lineMrTarget = await pagePoint(editor, lineUnits.x + lineUnits.width + 140, lineUnits.y)
      await dragBetween(editor, lineMr, lineMrTarget)

      const lineAfter = await readMeasures(editor, true)
      expect(lineAfter.width).toBeGreaterThan(lineBefore.width + 7)
      expect(lineAfter.y).toBeCloseTo(lineBefore.y, 1)
    })
  })
})
