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

export const PAGE_LABELS: Record<PageId, string> = {
  'back-cover': 'Contraportada',
  'front-cover': 'Portada',
  p1: 'Página 1',
  p2: 'Página 2',
  p3: 'Página 3',
  p4: 'Página 4',
  p5: 'Página 5',
  p6: 'Página 6'
}

export const PAGE_SHORT_LABELS: Record<PageId, string> = {
  'back-cover': 'Contra',
  'front-cover': 'Portada',
  p1: '1',
  p2: '2',
  p3: '3',
  p4: '4',
  p5: '5',
  p6: '6'
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
  locked?: boolean
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
}

export type ImageInsertResult = {
  ok: boolean
  error?: string
  warning?: string
}

export type ImageBatchSkippedFile = {
  fileName: string
  reason: 'browser-only' | 'not-image' | 'load-error' | 'no-page'
  message: string
}

export type ImageBatchInsertResult = {
  importedCount: number
  skippedFiles: ImageBatchSkippedFile[]
  errors: string[]
  warnings: string[]
  largeFileCount: number
  overflowCount: number
}
