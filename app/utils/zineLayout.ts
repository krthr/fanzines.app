import type { ImageElement, PageId } from '~/types/zine'

export const A4_W_MM = 297
export const A4_H_MM = 210

export const PANEL_W_MM = A4_W_MM / 4
export const PANEL_H_MM = A4_H_MM / 2

export const PAGE_W = 1000
export const PAGE_H = PAGE_W * (PANEL_H_MM / PANEL_W_MM)

export const PX_PER_MM = 96 / 25.4
export const EXPORT_DPI = 300
export const EXPORT_PIXEL_RATIO = EXPORT_DPI / 96
export const SAFE_MARGIN_MM = 5

export type LayoutRect = {
  x: number
  y: number
  width: number
  height: number
}

export const SAFE_MARGIN_X = PAGE_W * (SAFE_MARGIN_MM / PANEL_W_MM)
export const SAFE_MARGIN_Y = PAGE_H * (SAFE_MARGIN_MM / PANEL_H_MM)
export const FULL_PAGE_RECT: LayoutRect = {
  x: 0,
  y: 0,
  width: PAGE_W,
  height: PAGE_H
}

type ImageBox = Pick<ImageElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>

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

export function getPageSafeAreaRect(pageId: PageId): LayoutRect {
  const slot = IMPOSITION_SLOTS[pageId]
  const touchesSheetLeft = slot.col === 0
  const touchesSheetRight = slot.col === 3
  const touchesSheetTop = slot.row === 0
  const touchesSheetBottom = slot.row === 1
  const localLeftTouchesSheetEdge = slot.rotation === 180 ? touchesSheetRight : touchesSheetLeft
  const localRightTouchesSheetEdge = slot.rotation === 180 ? touchesSheetLeft : touchesSheetRight
  const localTopTouchesSheetEdge = slot.rotation === 180 ? touchesSheetBottom : touchesSheetTop
  const localBottomTouchesSheetEdge = slot.rotation === 180 ? touchesSheetTop : touchesSheetBottom
  const leftMargin = localLeftTouchesSheetEdge ? SAFE_MARGIN_X : 0
  const rightMargin = localRightTouchesSheetEdge ? SAFE_MARGIN_X : 0
  const topMargin = localTopTouchesSheetEdge ? SAFE_MARGIN_Y : 0
  const bottomMargin = localBottomTouchesSheetEdge ? SAFE_MARGIN_Y : 0

  return {
    x: leftMargin,
    y: topMargin,
    width: PAGE_W - leftMargin - rightMargin,
    height: PAGE_H - topMargin - bottomMargin
  }
}

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getRotatedOffsets(width: number, height: number, rotation: number) {
  const radians = rotation * (Math.PI / 180)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const points = [
    { x: 0, y: 0 },
    { x: width * cos, y: width * sin },
    { x: -height * sin, y: height * cos },
    { x: width * cos - height * sin, y: width * sin + height * cos }
  ]
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

export function getRotatedImageBounds(element: ImageBox): LayoutRect {
  const offsets = getRotatedOffsets(
    Math.max(1, element.width),
    Math.max(1, element.height),
    element.rotation
  )

  return {
    x: element.x + offsets.minX,
    y: element.y + offsets.minY,
    width: offsets.width,
    height: offsets.height
  }
}

export function isImageInsideSafeArea(element: ImageBox, safeArea: LayoutRect = FULL_PAGE_RECT) {
  const bounds = getRotatedImageBounds(element)
  const epsilon = 0.5

  return bounds.x >= safeArea.x - epsilon
    && bounds.y >= safeArea.y - epsilon
    && bounds.x + bounds.width <= safeArea.x + safeArea.width + epsilon
    && bounds.y + bounds.height <= safeArea.y + safeArea.height + epsilon
}

export function fitImageToSafeArea(element: ImageBox, safeArea: LayoutRect = FULL_PAGE_RECT): Pick<ImageElement, 'x' | 'y' | 'width' | 'height'> {
  const width = Math.max(1, element.width)
  const height = Math.max(1, element.height)
  const currentOffsets = getRotatedOffsets(width, height, element.rotation)
  const scale = Math.min(
    1,
    safeArea.width / currentOffsets.width,
    safeArea.height / currentOffsets.height
  )
  const nextWidth = width * scale
  const nextHeight = height * scale
  const nextOffsets = getRotatedOffsets(nextWidth, nextHeight, element.rotation)
  const desiredBoundsX = element.x + nextOffsets.minX
  const desiredBoundsY = element.y + nextOffsets.minY
  const boundsX = nextOffsets.width <= safeArea.width
    ? clamp(desiredBoundsX, safeArea.x, safeArea.x + safeArea.width - nextOffsets.width)
    : safeArea.x + (safeArea.width - nextOffsets.width) / 2
  const boundsY = nextOffsets.height <= safeArea.height
    ? clamp(desiredBoundsY, safeArea.y, safeArea.y + safeArea.height - nextOffsets.height)
    : safeArea.y + (safeArea.height - nextOffsets.height) / 2

  return {
    x: boundsX - nextOffsets.minX,
    y: boundsY - nextOffsets.minY,
    width: nextWidth,
    height: nextHeight
  }
}
