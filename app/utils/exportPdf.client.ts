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
import { renderSheetCanvas } from '~/utils/renderSheet.client'

const PDF_SAFE_MARGIN_MM = 5

type PdfSheetPlacement = {
  x: number
  y: number
  width: number
  height: number
}

function getPdfSheetPlacement(useSafeMargins: boolean): PdfSheetPlacement {
  if (!useSafeMargins) {
    return {
      x: 0,
      y: 0,
      width: A4_W_MM,
      height: A4_H_MM
    }
  }

  const innerWidth = A4_W_MM - PDF_SAFE_MARGIN_MM * 2
  const innerHeight = A4_H_MM - PDF_SAFE_MARGIN_MM * 2
  const scale = Math.min(innerWidth / A4_W_MM, innerHeight / A4_H_MM)
  const width = A4_W_MM * scale
  const height = A4_H_MM * scale

  return {
    x: (A4_W_MM - width) / 2,
    y: (A4_H_MM - height) / 2,
    width,
    height
  }
}

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

  const canvas = await renderSheetCanvas(state, {
    pxPerMm: PX_PER_MM,
    pixelRatio: EXPORT_PIXEL_RATIO,
    mimeType: 'image/png'
  })

  if (!canvas) return

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const placement = getPdfSheetPlacement(state.exportSafeMargins !== false)

  pdf.addImage(canvas, 'PNG', placement.x, placement.y, placement.width, placement.height)

  if (state.exportGuides) {
    drawPdfGuides(pdf)
  }

  pdf.save('fanzine-a4.pdf')
}
