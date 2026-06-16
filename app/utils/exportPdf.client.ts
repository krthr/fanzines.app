import { jsPDF } from "jspdf";
import type { ZineState } from "~/types/zine";
import {
  A4_H_MM,
  A4_W_MM,
  EXPORT_PIXEL_RATIO,
  PANEL_H_MM,
  PANEL_W_MM,
  PX_PER_MM,
} from "~/utils/zineLayout";
import { renderSheetCanvas } from "~/utils/renderSheet.client";

const PDF_SAFE_MARGIN_MM = 5;

type PdfSheetPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

function getPdfSheetPlacement(useSafeMargins: boolean): PdfSheetPlacement {
  if (!useSafeMargins) {
    return {
      x: 0,
      y: 0,
      width: A4_W_MM,
      height: A4_H_MM,
      scale: 1,
    };
  }

  const innerWidth = A4_W_MM - PDF_SAFE_MARGIN_MM * 2;
  const innerHeight = A4_H_MM - PDF_SAFE_MARGIN_MM * 2;
  const scale = Math.min(innerWidth / A4_W_MM, innerHeight / A4_H_MM);
  const width = A4_W_MM * scale;
  const height = A4_H_MM * scale;

  return {
    x: (A4_W_MM - width) / 2,
    y: (A4_H_MM - height) / 2,
    width,
    height,
    scale,
  };
}

function drawPdfGuides(pdf: jsPDF, placement: PdfSheetPlacement) {
  const pw = PANEL_W_MM;
  const ph = PANEL_H_MM;
  const x = (value: number) => placement.x + value * placement.scale;
  const y = (value: number) => placement.y + value * placement.scale;

  pdf.setLineWidth(0.2);
  pdf.setDrawColor(120, 120, 120);
  pdf.setLineDashPattern([1.5, 1.5], 0);

  pdf.line(x(pw), y(0), x(pw), y(A4_H_MM));
  pdf.line(x(pw * 2), y(0), x(pw * 2), y(A4_H_MM));
  pdf.line(x(pw * 3), y(0), x(pw * 3), y(A4_H_MM));

  pdf.line(x(0), y(ph), x(pw), y(ph));
  pdf.line(x(pw * 3), y(ph), x(A4_W_MM), y(ph));

  pdf.setLineDashPattern([], 0);
  pdf.setLineWidth(0.35);
  pdf.setDrawColor(163, 54, 43);
  pdf.line(x(pw), y(ph), x(pw * 3), y(ph));
}

export async function exportZinePdf(state: ZineState) {
  if (!import.meta.client) return;

  const canvas = await renderSheetCanvas(state, {
    pxPerMm: PX_PER_MM,
    pixelRatio: EXPORT_PIXEL_RATIO,
    mimeType: "image/png",
  });

  if (!canvas) return;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const placement = getPdfSheetPlacement(state.exportSafeMargins !== false);

  pdf.addImage(
    canvas,
    "PNG",
    placement.x,
    placement.y,
    placement.width,
    placement.height,
  );

  if (state.exportGuides) {
    drawPdfGuides(pdf, placement);
  }

  pdf.save("fanzine-a4.pdf");
}
