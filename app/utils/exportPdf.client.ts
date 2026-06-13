import { jsPDF } from 'jspdf'
import type { ZineState } from '~/types/zine'
import {
  A4_H_MM,
  A4_W_MM,
  EXPORT_PIXEL_RATIO,
  PANEL_H_MM,
  PANEL_W_MM,
  PX_PER_MM
} from '~/utils/zineLayout'
import { renderSheetDataUrl } from '~/utils/renderSheet.client'

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

export async function exportZinePdf(state: ZineState) {
  if (!import.meta.client) return

  const dataUrl = await renderSheetDataUrl(state, {
    pxPerMm: PX_PER_MM,
    pixelRatio: EXPORT_PIXEL_RATIO,
    mimeType: 'image/png'
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

  pdf.save('fanzine-a4.pdf')
}
