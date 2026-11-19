import type { ImageElement, ZineElement } from '~/types/zine'
import { PAGE_H, PAGE_W, getRotatedBounds } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'

export type HorizontalAlignment = 'left' | 'center' | 'right'
export type VerticalAlignment = 'top' | 'middle' | 'bottom'
export type DeleteInputMethod = 'inspector' | 'toolbar' | 'mobile_bar' | 'keyboard'

const ALIGNMENT_EPSILON = 1
const HORIZONTAL_ALIGNMENTS: HorizontalAlignment[] = ['left', 'center', 'right']
const VERTICAL_ALIGNMENTS: VerticalAlignment[] = ['top', 'middle', 'bottom']

// Alignment places what is visible: the element's bounds as rotated. The result is
// the x (or y) of its origin, which sits `offset` away from the visible edge.
function elementX(element: ZineElement, alignment: HorizontalAlignment) {
  const bounds = getRotatedBounds(element)
  const width = bounds.right - bounds.left
  const offset = element.x - bounds.left

  if (alignment === 'left') return offset
  if (alignment === 'center') return (PAGE_W - width) / 2 + offset
  return PAGE_W - width + offset
}

function elementY(element: ZineElement, alignment: VerticalAlignment) {
  const bounds = getRotatedBounds(element)
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

  // "Rellenar": the image covers the whole page.
  function coverPage() {
    const element = selectedElement.value
    if (element?.type !== 'image') return

    updateElement(element.id, { ...centeredImageBounds(element, 'cover'), rotation: 0 })
  }

  // "Encajar": the whole image fits inside the page.
  function containPage() {
    const element = selectedElement.value
    if (element?.type !== 'image') return

    updateElement(element.id, { ...centeredImageBounds(element, 'contain'), rotation: 0 })
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
