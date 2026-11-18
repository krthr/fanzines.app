import type { PageId } from '~/types/zine'

export const A4_W_MM = 297
export const A4_H_MM = 210

export const PANEL_W_MM = A4_W_MM / 4
export const PANEL_H_MM = A4_H_MM / 2

export const PAGE_W = 1000
export const PAGE_H = PAGE_W * (PANEL_H_MM / PANEL_W_MM)

// The store works in page units (PAGE_W = 1000). Everything shown to the user is in mm,
// and type sizes in points.
export const MM_PER_UNIT = PANEL_W_MM / PAGE_W
export const PT_PER_UNIT = MM_PER_UNIT * (72 / 25.4)

export const SAFE_MARGIN_MM = 5
export const SAFE_MARGIN = SAFE_MARGIN_MM / MM_PER_UNIT

export const PX_PER_MM = 96 / 25.4
export const EXPORT_DPI = 300
export const EXPORT_PIXEL_RATIO = EXPORT_DPI / 96

export type ImpositionSlot = {
  col: number
  row: number
  rotation: 0 | 180
  label: string
}

export const IMPOSITION_SLOTS: Record<PageId, ImpositionSlot> = {
  p6: { col: 0, row: 0, rotation: 180, label: '6' },
  p5: { col: 1, row: 0, rotation: 180, label: '5' },
  p4: { col: 2, row: 0, rotation: 180, label: '4' },
  p3: { col: 3, row: 0, rotation: 180, label: '3' },
  'back-cover': { col: 0, row: 1, rotation: 0, label: 'Contraportada' },
  'front-cover': { col: 1, row: 1, rotation: 0, label: 'Portada' },
  p1: { col: 2, row: 1, rotation: 0, label: '1' },
  p2: { col: 3, row: 1, rotation: 0, label: '2' }
}

export const IMPOSED_PAGE_IDS = Object.keys(IMPOSITION_SLOTS) as PageId[]

export function getImposedGroupTransform(slot: ImpositionSlot) {
  if (slot.rotation === 180) {
    return {
      x: (slot.col + 1) * PANEL_W_MM,
      y: PANEL_H_MM,
      rotation: 180 as const
    }
  }

  return {
    x: slot.col * PANEL_W_MM,
    y: slot.row * PANEL_H_MM,
    rotation: 0 as const
  }
}

export function clampToPage(value: number, max: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(Math.max(value, -max), max * 2)
}

export function unitsToMm(units: number) {
  return units * MM_PER_UNIT
}

export function mmToUnits(mm: number) {
  return mm / MM_PER_UNIT
}

export function unitsToPt(units: number) {
  return units * PT_PER_UNIT
}

export function ptToUnits(pt: number) {
  return pt / PT_PER_UNIT
}

export function formatMmSize(widthUnits: number, heightUnits: number) {
  return `${Math.round(unitsToMm(widthUnits))} × ${Math.round(unitsToMm(heightUnits))} mm`
}

export const PANEL_SIZE_LABEL = formatMmSize(PAGE_W, PAGE_H)

// Reading order as spreads: pages that touch face each other in the folded zine.
// The covers have no facing page.
export const READING_SPREADS: ReadonlyArray<readonly [PageId | null, PageId | null]> = [
  [null, 'front-cover'],
  ['p1', 'p2'],
  ['p3', 'p4'],
  ['p5', 'p6'],
  ['back-cover', null]
]

export function getFacingPageId(pageId: PageId): PageId | null {
  for (const [left, right] of READING_SPREADS) {
    if (left === pageId) return right
    if (right === pageId) return left
  }

  return null
}

export function getPageSide(pageId: PageId): 'left' | 'right' {
  return READING_SPREADS.some(([left]) => left === pageId) ? 'left' : 'right'
}
