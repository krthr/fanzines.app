import {
  NO_PAINT,
  type PageId,
  type ZineElementDraft
} from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { PANEL_H_MM, PANEL_W_MM, mmToUnits, ptToUnits } from '~/utils/zineLayout'

// PROTOTYPE: populates all 8 pages of the real zine store with a vibrant,
// punk-editorial pocket zine so the 3D swipe/rotate/fold views are immediately
// rewarding to test (and every element stays editable in the 2D editor).

const mm = mmToUnits
const pt = ptToUnits
const W = PANEL_W_MM
const H = PANEL_H_MM

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = NO_PAINT,
  strokeWidth = 0,
  rotation = 0
): ZineElementDraft {
  return {
    type: 'rect',
    x: mm(x),
    y: mm(y),
    width: mm(width),
    height: mm(height),
    rotation,
    opacity: 1,
    fill,
    stroke,
    strokeWidth: mm(strokeWidth)
  }
}

function circle(
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  stroke = NO_PAINT,
  strokeWidth = 0,
  opacity = 1
): ZineElementDraft {
  return {
    type: 'circle',
    x: mm(cx - radius),
    y: mm(cy - radius),
    width: mm(radius * 2),
    height: mm(radius * 2),
    rotation: 0,
    opacity,
    fill,
    stroke,
    strokeWidth: mm(strokeWidth)
  }
}

function line(
  x: number,
  y: number,
  length: number,
  stroke = '#0b0a09',
  strokeWidth = 0.5,
  rotation = 0,
  dash?: 'dashed' | 'dotted'
): ZineElementDraft {
  return {
    type: 'line',
    x: mm(x),
    y: mm(y),
    width: mm(length),
    height: 0,
    rotation,
    opacity: 1,
    stroke,
    strokeWidth: mm(strokeWidth),
    dash
  }
}

function txt(
  text: string,
  opts: {
    x: number
    y: number
    w: number
    h?: number
    size: number
    font?: 'Impact' | 'Arial' | 'Georgia' | 'Courier New' | 'Helvetica'
    style?: 'normal' | 'bold' | 'italic'
    fill?: string
    align?: 'left' | 'center' | 'right'
    lineHeight?: number
    rotation?: number
  }
): ZineElementDraft {
  const fontSize = pt(opts.size)
  const lineHeight = opts.lineHeight ?? 1.15
  const lines = text.split('\n').length

  return {
    type: 'text',
    text,
    x: mm(opts.x),
    y: mm(opts.y),
    width: mm(opts.w),
    height: opts.h ? mm(opts.h) : lines * fontSize * lineHeight + 12,
    rotation: opts.rotation ?? 0,
    opacity: 1,
    fontFamily: opts.font ?? 'Arial',
    fontSize,
    fontStyle: opts.style ?? 'normal',
    fill: opts.fill ?? '#0b0a09',
    align: opts.align ?? 'left',
    lineHeight
  }
}

function sampleDraftsByPage(): Record<PageId, ZineElementDraft[]> {
  return {
    'front-cover': [
      rect(0, 0, W, H, '#0b0a09'),
      rect(6, 6, W - 12, H - 12, NO_PAINT, '#ede7da', 0.6),
      circle(W * 0.72, H * 0.42, 22, '#d25a36'),
      rect(8, 11, 28, 7.5, '#e9ff5c', '#0b0a09', 0.4, -2),
      txt('ISSUE NO. 01', { x: 9.5, y: 12.6, w: 25, size: 7.5, font: 'Courier New', style: 'bold', fill: '#0b0a09', rotation: -2 }),
      txt('PAPER\nNOISE\nCLUB', { x: 9, y: 24, w: W - 18, size: 32, font: 'Impact', fill: '#ede7da', lineHeight: 0.96 }),
      line(9, 76, W - 18, '#e9ff5c', 0.8),
      txt('ONE A4 SHEET · EIGHT PAGES\nCUT, FOLD, PASS IT AROUND', { x: 9, y: 80, w: W - 18, size: 7.5, font: 'Courier New', fill: '#ede7da', lineHeight: 1.4 }),
      txt('FREE COPY · 2026', { x: 9, y: 92, w: W - 18, size: 7, font: 'Courier New', fill: '#d25a36', align: 'right' })
    ],

    p1: [
      {
        type: 'pattern',
        pattern: 'dot-grid',
        spacing: mm(5),
        stroke: '#d6d2ca',
        strokeWidth: mm(0.45),
        x: mm(6),
        y: mm(6),
        width: mm(W - 12),
        height: mm(H - 12),
        rotation: 0,
        opacity: 1
      },
      rect(7, 8, 12, 6, '#0b0a09'),
      txt('01', { x: 7, y: 9.2, w: 12, size: 9, font: 'Courier New', style: 'bold', fill: '#e9ff5c', align: 'center' }),
      txt('WHY PRINT\nSMALL?', { x: 7, y: 19, w: W - 14, size: 22, font: 'Impact', fill: '#0b0a09', lineHeight: 1.0 }),
      line(7, 40, W - 14, '#d25a36', 0.7),
      txt(
        'A pocket zine fits in a jacket, costs one photocopy, and never asks for an algorithm.\n\nFold one A4 page, make a single center cut, and eight blank panels turn into a real little book.',
        { x: 7, y: 45, w: W - 14, h: 48, size: 9.5, font: 'Georgia', fill: '#0b0a09', lineHeight: 1.42 }
      ),
      txt('p. 01', { x: 7, y: 95, w: W - 14, size: 7.5, font: 'Courier New', fill: '#5a554e' })
    ],

    p2: [
      rect(0, 0, W, 38, '#d25a36'),
      circle(W * 0.5, 38, 15, '#e9ff5c', '#0b0a09', 0.8),
      txt('8', { x: W * 0.5 - 10, y: 29, w: 20, size: 26, font: 'Impact', fill: '#0b0a09', align: 'center' }),
      txt('PANELS FROM\nONE SHEET', { x: 8, y: 10, w: W - 16, size: 15, font: 'Impact', fill: '#ffffff', align: 'center', lineHeight: 1.05 }),
      txt('THE RECIPE', { x: 8, y: 58, w: W - 16, size: 11, font: 'Courier New', style: 'bold', fill: '#0b0a09' }),
      line(8, 63, W - 16, '#0b0a09', 0.5),
      txt('01  Print landscape at 100%\n02  Fold lengthwise & crease\n03  Snip only the center slit\n04  Push into a pocket book', {
        x: 8,
        y: 67,
        w: W - 16,
        h: 26,
        size: 8.5,
        font: 'Courier New',
        fill: '#3a3631',
        lineHeight: 1.5
      }),
      txt('p. 02', { x: 7, y: 95, w: W - 14, size: 7.5, font: 'Courier New', fill: '#5a554e', align: 'right' })
    ],

    p3: [
      rect(0, 0, W, H, '#f4f0e8'),
      rect(6, 7, W - 12, 46, '#2f5bea'),
      circle(24, 30, 12, '#e9ff5c'),
      circle(49, 30, 12, '#d25a36', '#0b0a09', 0.6, 0.9),
      line(10, 14, 54, '#ffffff', 0.5, 22, 'dashed'),
      txt('“MAKE THINGS\nON PAPER AND\nHAND THEM TO\nYOUR FRIENDS.”', {
        x: 8,
        y: 59,
        w: W - 16,
        size: 14,
        font: 'Impact',
        fill: '#0b0a09',
        lineHeight: 1.08
      }),
      txt('— STUDIO WALL NOTE', { x: 8, y: 88, w: W - 16, size: 7.5, font: 'Courier New', fill: '#5a554e' }),
      txt('p. 03', { x: 7, y: 95, w: W - 14, size: 7.5, font: 'Courier New', fill: '#5a554e' })
    ],

    p4: [
      rect(6, 7, W - 12, H - 14, NO_PAINT, '#0b0a09', 0.55),
      txt('FIELD NOTES', { x: 10, y: 12, w: W - 20, size: 16, font: 'Impact', fill: '#0b0a09' }),
      line(10, 20, W - 20, '#0b0a09', 0.5),
      {
        type: 'pattern',
        pattern: 'lined',
        spacing: mm(7),
        stroke: '#b8b3aa',
        strokeWidth: mm(0.32),
        x: mm(10),
        y: mm(25),
        width: mm(W - 20),
        height: mm(58),
        rotation: 0,
        opacity: 1
      },
      rect(12, 31, 46, 12, '#e9ff5c', '#0b0a09', 0.45, -1.5),
      txt('Sketch, glue ticket stubs,\nor scribble chords here.', { x: 14, y: 33.2, w: 42, size: 8, font: 'Courier New', fill: '#0b0a09', rotation: -1.5, lineHeight: 1.3 }),
      txt('p. 04', { x: 7, y: 95, w: W - 14, size: 7.5, font: 'Courier New', fill: '#5a554e', align: 'right' })
    ],

    p5: [
      rect(0, 0, W, H, '#0b0a09'),
      txt('PRINT\nCHECK', { x: 8, y: 10, w: W - 16, size: 22, font: 'Impact', fill: '#e9ff5c', lineHeight: 0.98 }),
      line(8, 32, W - 16, '#ede7da', 0.5),
      ...[0, 1, 2, 3, 4].flatMap((index) => {
        const y = 39 + index * 10
        const labels = ['A4 paper loaded', 'Scale set to 100%', 'Scissors ready', 'Bone folder / thumb', 'Share 5 copies']
        return [
          rect(8, y, 4.5, 4.5, index < 3 ? '#d25a36' : NO_PAINT, '#ede7da', 0.45),
          txt(labels[index] ?? '', { x: 16, y: y - 0.5, w: W - 24, size: 9, font: 'Courier New', fill: '#ede7da' })
        ]
      }),
      txt('p. 05', { x: 7, y: 95, w: W - 14, size: 7.5, font: 'Courier New', fill: '#a8a196' })
    ],

    p6: [
      {
        type: 'pattern',
        pattern: 'square-grid',
        spacing: mm(6),
        stroke: '#dedad2',
        strokeWidth: mm(0.3),
        x: mm(6),
        y: mm(6),
        width: mm(W - 12),
        height: mm(H - 12),
        rotation: 0,
        opacity: 1
      },
      rect(8, 12, W - 16, 22, '#0b0a09'),
      txt('ROTATE ME 360°', { x: 10, y: 18.5, w: W - 20, size: 14, font: 'Impact', fill: '#ede7da', align: 'center' }),
      circle(W * 0.3, 56, 11, '#d25a36'),
      circle(W * 0.52, 60, 11, '#2f5bea', NO_PAINT, 0, 0.85),
      circle(W * 0.72, 54, 10, '#e9ff5c', '#0b0a09', 0.5),
      txt('Every edit you make on the\n2D canvas updates this\n3D booklet live.', {
        x: 8,
        y: 74,
        w: W - 16,
        size: 9,
        font: 'Georgia',
        style: 'italic',
        fill: '#0b0a09',
        align: 'center',
        lineHeight: 1.35
      }),
      txt('p. 06', { x: 7, y: 95, w: W - 14, size: 7.5, font: 'Courier New', fill: '#5a554e', align: 'right' })
    ],

    'back-cover': [
      rect(0, 0, W, H, '#ede7da'),
      rect(6, 6, W - 12, H - 12, NO_PAINT, '#0b0a09', 0.6),
      circle(W / 2, 34, 15, '#0b0a09'),
      txt('END', { x: W / 2 - 12, y: 28, w: 24, size: 17, font: 'Impact', fill: '#e9ff5c', align: 'center' }),
      txt('COLOPHON', { x: 10, y: 56, w: W - 20, size: 11, font: 'Impact', fill: '#0b0a09', align: 'center' }),
      line(18, 63, W - 36, '#d25a36', 0.6),
      txt('Typeset in the browser.\nPrinted on 1 A4 sheet.\nEdition of ∞ · fanzines.app', {
        x: 10,
        y: 67,
        w: W - 20,
        size: 8.5,
        font: 'Courier New',
        fill: '#3a3631',
        align: 'center',
        lineHeight: 1.5
      }),
      rect(18, 86, W - 36, 8, '#0b0a09'),
      txt('FOLD · CUT · SHARE', { x: 18, y: 88, w: W - 36, size: 7.5, font: 'Courier New', style: 'bold', fill: '#ede7da', align: 'center' })
    ]
  }
}

export function populateSampleZine() {
  const { resetZine, addElementDrafts, selectPage } = useZineStore()

  resetZine()
  const drafts = sampleDraftsByPage()

  for (const [pageId, pageDrafts] of Object.entries(drafts) as Array<[PageId, ZineElementDraft[]]>) {
    addElementDrafts(pageId, pageDrafts)
  }

  selectPage('front-cover')
}
