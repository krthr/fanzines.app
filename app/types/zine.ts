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

// Text colour is one of these five swatches; the first is the default for new text.
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

export type ZineElement = ImageElement | TextElement

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
