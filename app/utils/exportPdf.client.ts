import Konva from 'konva'
import { jsPDF } from 'jspdf'
import type { PageId, ZineState } from '~/types/zine'
import {
  A4_H_MM,
  A4_W_MM,
  EXPORT_PIXEL_RATIO,
  IMPOSED_PAGE_IDS,
  IMPOSITION_SLOTS,
  PAGE_H,
  PAGE_W,
  PANEL_H_MM,
  PANEL_W_MM,
  PX_PER_MM,
  getImposedGroupTransform
} from '~/utils/zineLayout'
import { renderElementsIntoGroup } from '~/utils/renderZine.client'

function drawPdfGuides(pdf: jsPDF) {
  const pw = PANEL_W_MM
  const ph = PANEL_H_MM

  pdf.setLineWidth(0.2)
  pdf.setDrawColor(120, 120, 120)
  pdf.setLineDashPattern([1.5, 1.5], 0)

  pdf.line(pw, 0, pw, A4_H_MM)
  pdf.line(pw * 2, 0, pw * 2, A4_H_MM)
  pdf.line(pw * 3, 0, pw * 3, A4_H_MM)

  pdf.line(0, ph, pw, ph)
  pdf.line(pw * 3, ph, A4_W_MM, ph)

  pdf.setLineDashPattern([], 0)
  pdf.setLineWidth(0.35)
  pdf.setDrawColor(163, 54, 43)
  pdf.line(pw, ph, pw * 3, ph)
}

function createOffscreenContainer() {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = `${A4_W_MM * PX_PER_MM}px`
  container.style.height = `${A4_H_MM * PX_PER_MM}px`
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)
  return container
}

function getPageElements(state: ZineState, pageId: PageId) {
  return state.pageElementIds[pageId].map((id) => state.elements[id]).filter(Boolean)
}

export async function exportZinePdf(state: ZineState) {
  if (!import.meta.client) return

  const container = createOffscreenContainer()
  const stage = new Konva.Stage({
    container,
    width: A4_W_MM * PX_PER_MM,
    height: A4_H_MM * PX_PER_MM
  })

  try {
    const layer = new Konva.Layer()
    const root = new Konva.Group({
      scaleX: PX_PER_MM,
      scaleY: PX_PER_MM
    })

    stage.add(layer)
    layer.add(root)
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

    layer.draw()

    const dataUrl = stage.toDataURL({
      mimeType: 'image/png',
      pixelRatio: EXPORT_PIXEL_RATIO
    })

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    pdf.addImage(dataUrl, 'PNG', 0, 0, A4_W_MM, A4_H_MM)

    if (state.exportGuides) {
      drawPdfGuides(pdf)
    }

    pdf.save('mini-zine-a4.pdf')
  } finally {
    stage.destroy()
    container.remove()
  }
}
