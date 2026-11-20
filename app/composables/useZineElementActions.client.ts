import { isShapeElement, type ImageElement, type ZineElement } from '~/types/zine'
import { PAGE_H, PAGE_W, SAFE_MARGIN, getRotatedBounds } from '~/utils/zineLayout'
import { hasPaint } from '~/utils/zineShapes'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'

export type HorizontalAlignment = 'left' | 'center' | 'right'
export type VerticalAlignment = 'top' | 'middle' | 'bottom'
export type DeleteInputMethod = 'inspector' | 'toolbar' | 'mobile_bar' | 'keyboard'

const ALIGNMENT_EPSILON = 1
const HORIZONTAL_ALIGNMENTS: HorizontalAlignment[] = ['left', 'center', 'right']
const VERTICAL_ALIGNMENTS: VerticalAlignment[] = ['top', 'middle', 'bottom']

// What is painted, as rotated. A shape's border and a line's thickness reach half a
// stroke beyond the element's box, so snapping a thick line to the top of the page
// doesn't cut half of it off.
function paintedBounds(element: ZineElement) {
  const half = isShapeElement(element) && hasPaint(element.stroke) ? element.strokeWidth / 2 : 0
  if (!half) return getRotatedBounds(element)

  const isLine = element.type === 'line'
  const left = isLine ? 0 : -half
  const top = -half
  const radians = element.rotation * Math.PI / 180

  return getRotatedBounds({
    x: element.x + left * Math.cos(radians) - top * Math.sin(radians),
    y: element.y + left * Math.sin(radians) + top * Math.cos(radians),
    width: element.width - left * 2,
    height: isLine ? half * 2 : element.height + half * 2,
    rotation: element.rotation
  })
}

// Alignment places what is visible: the painted bounds. The result is the x (or y) of
// the element's origin, which sits `offset` away from the visible edge.
function elementX(element: ZineElement, alignment: HorizontalAlignment) {
  const bounds = paintedBounds(element)
  const width = bounds.right - bounds.left
  const offset = element.x - bounds.left

  if (alignment === 'left') return offset
  if (alignment === 'center') return (PAGE_W - width) / 2 + offset
  return PAGE_W - width + offset
}

function elementY(element: ZineElement, alignment: VerticalAlignment) {
  const bounds = paintedBounds(element)
  const height = bounds.bottom - bounds.top
  const offset = element.y - bounds.top

  if (alignment === 'top') return offset
  if (alignment === 'middle') return (PAGE_H - height) / 2 + offset
  return PAGE_H - height + offset
}

function isAligned(value: number, target: number) {
  return Math.abs(value - target) < ALIGNMENT_EPSILON
}

// An element as wide (or tall) as the page lands on the same spot for every alignment.
function hasHorizontalMovement(element: ZineElement) {
  return HORIZONTAL_ALIGNMENTS.some((alignment) => !isAligned(element.x, elementX(element, alignment)))
}

function hasVerticalMovement(element: ZineElement) {
  return VERTICAL_ALIGNMENTS.some((alignment) => !isAligned(element.y, elementY(element, alignment)))
}

function centeredImageBounds(element: ImageElement, fit: 'contain' | 'cover') {
  const sourceWidth = element.naturalWidth || element.width
  const sourceHeight = element.naturalHeight || element.height
  const pick = fit === 'contain' ? Math.min : Math.max
  const scale = pick(PAGE_W / sourceWidth, PAGE_H / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    x: (PAGE_W - width) / 2,
    y: (PAGE_H - height) / 2,
    width,
    height
  }
}

// Paper isn't cropped like a photo: "Fill" runs it edge to edge, and "Fit" keeps it
// inside the 5 mm safe margin, where the printer can't cut it off.
const PAPER_BOUNDS = {
  cover: { x: 0, y: 0, width: PAGE_W, height: PAGE_H },
  contain: { x: SAFE_MARGIN, y: SAFE_MARGIN, width: PAGE_W - SAFE_MARGIN * 2, height: PAGE_H - SAFE_MARGIN * 2 }
}

function pageFitBounds(element: ZineElement, fit: 'contain' | 'cover') {
  if (element.type === 'image') return centeredImageBounds(element, fit)
  if (element.type === 'pattern') return PAPER_BOUNDS[fit]
  return null
}

// Photos and paper have "Fill" and "Fit".
export function canFitToPage(element: ZineElement) {
  return element.type === 'image' || element.type === 'pattern'
}

// Every action on the selected element, shared by the inspector, the floating
// toolbar, the mobile bar and the keyboard.
export function useZineElementActions() {
  const {
    elementCount,
    selectedElement,
    updateElement,
    deleteElement,
    moveElementForward,
    moveElementBackward
  } = useZineStore()
  const { trackZineEvent } = useZineAnalytics()

  // "Rellenar": the image covers the whole page, and so does paper.
  function coverPage() {
    const element = selectedElement.value
    const bounds = element && pageFitBounds(element, 'cover')
    if (element && bounds) updateElement(element.id, { ...bounds, rotation: 0 })
  }

  // "Encajar": the whole image fits inside the page; paper, inside the safe margin.
  function containPage() {
    const element = selectedElement.value
    const bounds = element && pageFitBounds(element, 'contain')
    if (element && bounds) updateElement(element.id, { ...bounds, rotation: 0 })
  }

  function centerOnPage() {
    const element = selectedElement.value
    if (!element) return

    updateElement(element.id, {
      x: elementX(element, 'center'),
      y: elementY(element, 'middle')
    })
  }

  function alignHorizontal(alignment: HorizontalAlignment) {
    const element = selectedElement.value
    if (!element || !hasHorizontalMovement(element)) return

    updateElement(element.id, { x: elementX(element, alignment) })
  }

  function alignVertical(alignment: VerticalAlignment) {
    const element = selectedElement.value
    if (!element || !hasVerticalMovement(element)) return

    updateElement(element.id, { y: elementY(element, alignment) })
  }

  function canAlignHorizontal() {
    const element = selectedElement.value
    return Boolean(element && hasHorizontalMovement(element))
  }

  function canAlignVertical() {
    const element = selectedElement.value
    return Boolean(element && hasVerticalMovement(element))
  }

  function isHorizontallyAligned(alignment: HorizontalAlignment) {
    const element = selectedElement.value
    return Boolean(element
      && hasHorizontalMovement(element)
      && isAligned(element.x, elementX(element, alignment)))
  }

  function isVerticallyAligned(alignment: VerticalAlignment) {
    const element = selectedElement.value
    return Boolean(element
      && hasVerticalMovement(element)
      && isAligned(element.y, elementY(element, alignment)))
  }

  function bringForward() {
    if (selectedElement.value) moveElementForward(selectedElement.value.id)
  }

  function sendBackward() {
    if (selectedElement.value) moveElementBackward(selectedElement.value.id)
  }

  function removeSelected(inputMethod: DeleteInputMethod) {
    const element = selectedElement.value
    if (!element) return

    deleteElement(element.id)
    trackZineEvent('zine_element_deleted', {
      page_id: element.pageId,
      element_type: element.type,
      input_method: inputMethod,
      element_count: elementCount.value
    })
  }

  return {
    coverPage,
    containPage,
    centerOnPage,
    alignHorizontal,
    alignVertical,
    canAlignHorizontal,
    canAlignVertical,
    isHorizontallyAligned,
    isVerticallyAligned,
    bringForward,
    sendBackward,
    removeSelected
  }
}
