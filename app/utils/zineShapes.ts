import type { Context } from 'konva/lib/Context'
import type { Shape } from 'konva/lib/Shape'
import {
  NO_PAINT,
  type CircleElement,
  type LineElement,
  type PatternElement,
  type PatternKind,
  type RectElement,
  type ShapeKind,
  type ZineElementDraft
} from '~/types/zine'
import { PAGE_H, PAGE_W, mmToUnits } from '~/utils/zineLayout'

// Everything here is shared by the canvas, the thumbnails, the sheet, the PDF and the
// layout previews, so a shape looks the same wherever it is drawn.

export const SHAPE_INK = '#0b0a09'

// Soft greys for the pages people print and write on: in black and white they come
// out light, and handwriting reads over them.
export const RULE_GREY = '#b8b3aa'
export const FAINT_GREY = '#dedad2'
export const DOT_GREY = '#9c968b'
export const GRID_GREY = '#d6d2ca'

export const DEFAULT_STROKE_WIDTH = mmToUnits(0.5)

export function hasPaint(paint: string | undefined): paint is string {
  return Boolean(paint) && paint !== NO_PAINT
}

// What "+ Shape" adds: centred on the page, an ink outline with no fill.
export function createShapeDraft(kind: ShapeKind): ZineElementDraft {
  const base = { rotation: 0, opacity: 1, stroke: SHAPE_INK, strokeWidth: DEFAULT_STROKE_WIDTH }

  if (kind === 'line') {
    const length = mmToUnits(50)
    return { ...base, type: 'line', x: (PAGE_W - length) / 2, y: PAGE_H / 2, width: length, height: 0 }
  }

  const width = mmToUnits(kind === 'rect' ? 40 : 30)
  const height = mmToUnits(30)

  return {
    ...base,
    type: kind,
    fill: NO_PAINT,
    x: (PAGE_W - width) / 2,
    y: (PAGE_H - height) / 2,
    width,
    height
  }
}

// ── Lines ───────────────────────────────────────────────────────────────────

export function getLineDash(element: Pick<LineElement, 'dash' | 'strokeWidth'>): number[] | undefined {
  if (element.dash === 'dotted') return [0, element.strokeWidth * 2]
  if (element.dash === 'dashed') {
    return [Math.max(element.strokeWidth * 4, mmToUnits(1.6)), Math.max(element.strokeWidth * 3, mmToUnits(1.2))]
  }

  return undefined
}

// ── Patterns ────────────────────────────────────────────────────────────────

export const PATTERN_PRESETS: Record<PatternKind, Pick<PatternElement, 'spacing' | 'stroke' | 'strokeWidth'>> = {
  'lined': { spacing: mmToUnits(7), stroke: RULE_GREY, strokeWidth: mmToUnits(0.3) },
  'dot-grid': { spacing: mmToUnits(5), stroke: DOT_GREY, strokeWidth: mmToUnits(0.76) },
  'square-grid': { spacing: mmToUnits(5), stroke: GRID_GREY, strokeWidth: mmToUnits(0.22) }
}

export const MIN_PATTERN_SPACING = mmToUnits(2)

type PatternShape = Pick<PatternElement, 'pattern' | 'spacing' | 'width' | 'height'>

export type PatternGeometry = {
  // [x1, y1, x2, y2], in the block's own coordinates.
  lines: Array<[number, number, number, number]>
  // [cx, cy]
  dots: Array<[number, number]>
}

// The marks of one axis: as many as fit, centred in the block.
function marksAlong(size: number, spacing: number) {
  const gaps = Math.floor(size / spacing + 1e-6)
  const offset = (size - gaps * spacing) / 2
  return Array.from({ length: gaps + 1 }, (_, index) => offset + index * spacing)
}

export function getPatternGeometry(element: PatternShape): PatternGeometry {
  const width = Math.abs(element.width)
  const height = Math.abs(element.height)
  const spacing = Math.max(element.spacing, MIN_PATTERN_SPACING)
  const geometry: PatternGeometry = { lines: [], dots: [] }

  if (!width || !height) return geometry

  const rows = marksAlong(height, spacing)

  if (element.pattern === 'lined') {
    geometry.lines = rows.map((y) => [0, y, width, y])
    return geometry
  }

  const columns = marksAlong(width, spacing)

  if (element.pattern === 'dot-grid') {
    geometry.dots = rows.flatMap((y) => columns.map((x): [number, number] => [x, y]))
    return geometry
  }

  // Graph paper: closed squares, so the grid stops at its last full row and column.
  const left = columns[0] ?? 0
  const right = columns[columns.length - 1] ?? width
  const top = rows[0] ?? 0
  const bottom = rows[rows.length - 1] ?? height

  geometry.lines = [
    ...columns.map((x): [number, number, number, number] => [x, top, x, bottom]),
    ...rows.map((y): [number, number, number, number] => [left, y, right, y])
  ]

  return geometry
}

// ── Konva nodes ─────────────────────────────────────────────────────────────

type NodeBox = Pick<RectElement, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity'>

function boxConfig(element: NodeBox) {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity
  }
}

// With no fill, the fill is switched off rather than made transparent: Konva would
// still count the inside of the shape as hit, and an empty frame would catch every
// click meant for what lies under it.
function paintConfig(element: RectElement | CircleElement) {
  const filled = hasPaint(element.fill)
  const stroked = hasPaint(element.stroke)

  return {
    fill: filled ? element.fill : undefined,
    fillEnabled: filled,
    stroke: stroked ? element.stroke : undefined,
    strokeEnabled: stroked,
    strokeWidth: element.strokeWidth
  }
}

export function rectNodeConfig(element: RectElement) {
  return { ...boxConfig(element), ...paintConfig(element) }
}

function drawEllipse(context: Context, shape: Shape) {
  const width = shape.width()
  const height = shape.height()

  context.beginPath()
  context.ellipse(width / 2, height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2)
  context.closePath()
  context.fillStrokeShape(shape)
}

// A Konva.Shape rather than a Konva.Ellipse: the ellipse is drawn inside its box, so it
// moves, rotates and resizes from the top-left corner like every other element.
export function circleNodeConfig(element: CircleElement) {
  return { ...boxConfig(element), ...paintConfig(element), sceneFunc: drawEllipse }
}

export function lineNodeConfig(element: LineElement) {
  return {
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    opacity: element.opacity,
    points: [0, 0, element.width, 0],
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    dash: getLineDash(element),
    lineCap: element.dash === 'dotted' ? 'round' as const : 'butt' as const
  }
}

// The geometry is worked out at draw time from the node itself, so the marks keep
// their spacing while the block is being resized.
function drawPattern(context: Context, shape: Shape) {
  const geometry = getPatternGeometry({
    pattern: shape.getAttr('patternKind'),
    spacing: shape.getAttr('patternSpacing'),
    width: shape.width(),
    height: shape.height()
  })
  const radius = shape.strokeWidth() / 2

  context.beginPath()

  for (const [x1, y1, x2, y2] of geometry.lines) {
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
  }

  for (const [cx, cy] of geometry.dots) {
    context.moveTo(cx + radius, cy)
    context.arc(cx, cy, radius, 0, Math.PI * 2)
  }

  context.fillStrokeShape(shape)
}

// The whole block takes the pointer, not only its thin marks.
function hitPatternBox(context: Context, shape: Shape) {
  context.beginPath()
  context.rect(0, 0, shape.width(), shape.height())
  context.closePath()
  context.fillShape(shape)
}

export function patternNodeConfig(element: PatternElement) {
  const dots = element.pattern === 'dot-grid'

  return {
    ...boxConfig(element),
    patternKind: element.pattern,
    patternSpacing: element.spacing,
    fill: dots ? element.stroke : undefined,
    stroke: dots ? undefined : element.stroke,
    strokeWidth: element.strokeWidth,
    sceneFunc: drawPattern,
    hitFunc: hitPatternBox
  }
}
