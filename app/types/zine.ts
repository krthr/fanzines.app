export const PAGE_IDS = [
  'front-cover',
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
  'p6',
  'back-cover'
] as const

export type PageId = typeof PAGE_IDS[number]

// Inner pages are numbered 1 to 6; the covers have no number. The names of the pages
// are translated: see useZinePageLabels.
export function getPageNumber(pageId: PageId): number | null {
  return pageId === 'front-cover' || pageId === 'back-cover' ? null : PAGE_IDS.indexOf(pageId)
}

export const FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'system-ui'
] as const

// The five swatches offered for text colour; the first is the default for new text.
// Any other '#rrggbb' can be picked as a custom colour.
export const TEXT_COLOR_OPTIONS = [
  '#0b0a09',
  '#ffffff',
  '#d25a36',
  '#e9ff5c',
  '#2f5bea'
] as const

export type FontOption = typeof FONT_OPTIONS[number]

export type BaseElement = {
  id: string
  pageId: PageId
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
}

export type ImageElement = BaseElement & {
  type: 'image'
  src: string
  fileName?: string
  naturalWidth: number
  naturalHeight: number
}

export type TextElement = BaseElement & {
  type: 'text'
  text: string
  fontFamily: FontOption
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic'
  fill: string
  align: 'left' | 'center' | 'right'
  lineHeight: number
}

// A fill or stroke: '#rrggbb', or 'transparent' for none (an empty frame, a checkbox).
export type ShapePaint = string

export const NO_PAINT = 'transparent'

// x/y is the top-left corner of the box the shape is drawn in, like every element.
export type RectElement = BaseElement & {
  type: 'rect'
  fill: ShapePaint
  stroke: ShapePaint
  // In page units.
  strokeWidth: number
}

export type CircleElement = BaseElement & {
  type: 'circle'
  fill: ShapePaint
  stroke: ShapePaint
  strokeWidth: number
}

// A straight line: x/y is where it starts, `width` its length and `rotation` its angle.
// It has no height of its own.
export type LineElement = BaseElement & {
  type: 'line'
  stroke: string
  strokeWidth: number
  dash?: 'dashed' | 'dotted'
}

export const PATTERN_KINDS = ['lined', 'dot-grid', 'square-grid'] as const

export type PatternKind = typeof PATTERN_KINDS[number]

// A block of ruled lines, dots or squares, drawn as one node however many marks it has.
// The marks keep their spacing when the block is resized: a bigger block has more of them.
export type PatternElement = BaseElement & {
  type: 'pattern'
  pattern: PatternKind
  // Distance between lines or dots, in page units.
  spacing: number
  stroke: string
  // The thickness of a line, or the diameter of a dot, in page units.
  strokeWidth: number
}

export type ShapeElement = RectElement | CircleElement | LineElement

export type ShapeKind = ShapeElement['type']

export const SHAPE_KINDS = ['rect', 'circle', 'line'] as const satisfies readonly ShapeKind[]

export type ZineElement = ImageElement | TextElement | ShapeElement | PatternElement

export type ZineElementType = ZineElement['type']

export function isShapeElement(element: ZineElement): element is ShapeElement {
  return element.type === 'rect' || element.type === 'circle' || element.type === 'line'
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

// An element before it is placed on a page: what a page layout produces.
export type ZineElementDraft = DistributiveOmit<ZineElement, 'id' | 'pageId'>

export type ZineState = {
  selectedPageId: PageId
  selectedElementId: string | null
  elements: Record<string, ZineElement>
  pageElementIds: Record<PageId, string[]>
  previewGuides: boolean
  exportGuides: boolean
  exportSafeMargins: boolean
}

export type ImageBatchSkippedFile = {
  // Empty when the file has no name.
  fileName: string
  reason: 'browser-only' | 'not-image' | 'load-error' | 'no-page'
}

export type ImageBatchInsertResult = {
  importedCount: number
  skippedFiles: ImageBatchSkippedFile[]
  largeFileCount: number
  overflowCount: number
}
