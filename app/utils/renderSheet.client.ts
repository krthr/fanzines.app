import Konva from 'konva'
import type { PageId, ZineElement, ZineState } from '~/types/zine'
import {
  A4_H_MM,
  A4_W_MM,
  IMPOSED_PAGE_IDS,
  IMPOSITION_SLOTS,
  PAGE_H,
  PAGE_W,
  PANEL_H_MM,
  PANEL_W_MM,
  getImposedGroupTransform
} from '~/utils/zineLayout'
import { renderElementsIntoGroup } from '~/utils/renderZine.client'

type RenderSheetDataUrlOptions = {
  pxPerMm: number
  pixelRatio?: number
  mimeType?: string
}

function createOffscreenContainer(width: number, height: number) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = `${width}px`
  container.style.height = `${height}px`
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)
  return container
}

function getPageElements(state: ZineState, pageId: PageId): ZineElement[] {
  return state.pageElementIds[pageId]
    .map((id) => state.elements[id])
    .filter((element): element is ZineElement => Boolean(element))
}

async function renderSheetIntoRoot(root: Konva.Group, state: ZineState) {
  root.add(new Konva.Rect({
    x: 0,
    y: 0,
    width: A4_W_MM,
    height: A4_H_MM,
    fill: '#ffffff',
    listening: false
  }))

  for (const pageId of IMPOSED_PAGE_IDS) {
    const slot = IMPOSITION_SLOTS[pageId]
    const transform = getImposedGroupTransform(slot)
    const pageGroup = new Konva.Group({
      x: transform.x,
      y: transform.y,
      rotation: transform.rotation,
      scaleX: PANEL_W_MM / PAGE_W,
      scaleY: PANEL_H_MM / PAGE_H,
      clipX: 0,
      clipY: 0,
      clipWidth: PAGE_W,
      clipHeight: PAGE_H,
      listening: false
    })

    pageGroup.add(new Konva.Rect({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      fill: '#ffffff',
      listening: false
    }))

    await renderElementsIntoGroup(pageGroup, getPageElements(state, pageId))
    root.add(pageGroup)
  }
}

export async function renderSheetDataUrl(state: ZineState, options: RenderSheetDataUrlOptions) {
  if (!import.meta.client) return ''

  const width = A4_W_MM * options.pxPerMm
  const height = A4_H_MM * options.pxPerMm
  const container = createOffscreenContainer(width, height)
  const stage = new Konva.Stage({ container, width, height })

  try {
    const layer = new Konva.Layer()
    const root = new Konva.Group({
      scaleX: options.pxPerMm,
      scaleY: options.pxPerMm
    })

    stage.add(layer)
    layer.add(root)
    await renderSheetIntoRoot(root, state)
    layer.draw()

    return stage.toDataURL({
      mimeType: options.mimeType ?? 'image/png',
      pixelRatio: options.pixelRatio ?? 1
    })
  } finally {
    stage.destroy()
    container.remove()
  }
}
