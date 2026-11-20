import {
  NO_PAINT,
  type FontOption,
  type PatternKind,
  type TextElement,
  type ZineElementDraft
} from '~/types/zine'
import { PANEL_W_MM, mmToUnits, ptToUnits } from '~/utils/zineLayout'
import { FAINT_GREY, PATTERN_PRESETS, RULE_GREY, SHAPE_INK } from '~/utils/zineShapes'

// The page layouts: each one is a list of ordinary elements (text, shapes, a pattern)
// that a click or a drop appends to a page. Positions are in millimetres on the
// 74.25 × 105 mm panel and stay inside the 5 mm safe margin; type sizes are in points.
// A whole-zine starter can later be a map of PageId to layout ids, built page by page
// with `build` and `addElementDrafts`.

export const PAGE_LAYOUT_CATEGORIES = ['covers', 'editorial', 'structured', 'paper'] as const

export type PageLayoutCategory = typeof PAGE_LAYOUT_CATEGORIES[number]

// Resolves one of the layout's texts (`editor.layouts.copy.<id>.<key>`) in the
// language of the editor, when the layout is added.
export type PageLayoutCopy = (key: string) => string

export type PageLayout = {
  id: string
  category: PageLayoutCategory
  build: (copy: PageLayoutCopy) => ZineElementDraft[]
}

const W = PANEL_W_MM
// The content column most layouts share: 8 mm in from each side.
const LEFT = 8
const RIGHT = W - 8
const COLUMN = RIGHT - LEFT

const INK = SHAPE_INK
const SUB = '#5a554e'

const mm = mmToUnits
const PT_PER_MM = 72 / 25.4

type TextOptions = {
  // Where the first line sits, as a baseline in mm, like the approved catalog.
  baseline: number
  x?: number
  width?: number
  size: number
  font?: FontOption
  style?: TextElement['fontStyle']
  align?: TextElement['align']
  color?: string
  lineHeight?: number
}

// Konva centres each line in its line box, so the top of the box sits about a third
// of an em plus half a line above the baseline.
function text(value: string, options: TextOptions): ZineElementDraft {
  const lineHeight = options.lineHeight ?? 1.2
  const sizeMm = options.size / PT_PER_MM
  const top = options.baseline - (0.35 + lineHeight / 2) * sizeMm
  const fontSize = ptToUnits(options.size)
  const lines = value.split('\n').length

  return {
    type: 'text',
    text: value,
    x: mm(options.x ?? LEFT),
    y: mm(top),
    width: mm(options.width ?? COLUMN),
    height: lines * fontSize * lineHeight,
    rotation: 0,
    opacity: 1,
    fontFamily: options.font ?? 'Arial',
    fontSize,
    fontStyle: options.style ?? 'normal',
    fill: options.color ?? INK,
    align: options.align ?? 'left',
    lineHeight
  }
}

function frame(x: number, y: number, width: number, height: number, stroke = INK, strokeWidth = 0.45): ZineElementDraft {
  return {
    type: 'rect',
    x: mm(x),
    y: mm(y),
    width: mm(width),
    height: mm(height),
    rotation: 0,
    opacity: 1,
    fill: NO_PAINT,
    stroke,
    strokeWidth: mm(strokeWidth)
  }
}

function ring(cx: number, cy: number, radius: number, strokeWidth = 0.45): ZineElementDraft {
  return {
    type: 'circle',
    x: mm(cx - radius),
    y: mm(cy - radius),
    width: mm(radius * 2),
    height: mm(radius * 2),
    rotation: 0,
    opacity: 1,
    fill: NO_PAINT,
    stroke: INK,
    strokeWidth: mm(strokeWidth)
  }
}

function rule(x1: number, x2: number, y: number, stroke = RULE_GREY, strokeWidth = 0.32): ZineElementDraft {
  return {
    type: 'line',
    x: mm(x1),
    y: mm(y),
    width: mm(x2 - x1),
    height: 0,
    rotation: 0,
    opacity: 1,
    stroke,
    strokeWidth: mm(strokeWidth)
  }
}

function pattern(kind: PatternKind, x: number, y: number, width: number, height: number): ZineElementDraft {
  return {
    type: 'pattern',
    pattern: kind,
    ...PATTERN_PRESETS[kind],
    x: mm(x),
    y: mm(y),
    width: mm(width),
    height: mm(height),
    rotation: 0,
    opacity: 1
  }
}

const range = (count: number) => Array.from({ length: count }, (_, index) => index)

const display = { font: 'Impact', lineHeight: 1.05 } as const
const mono = { font: 'Courier New', color: SUB } as const
const centered = { align: 'center' } as const

export const PAGE_LAYOUTS = [
  // ── Covers ──────────────────────────────────────────────────────────────
  {
    id: 'cover-classic',
    category: 'covers',
    build: (copy) => [
      text(copy('title'), { ...display, ...centered, baseline: 40, size: 26 }),
      text(copy('subtitle'), { ...centered, baseline: 49.5, size: 11.5, font: 'Georgia', style: 'italic', color: SUB }),
      text(copy('byline'), { ...mono, ...centered, baseline: 92, size: 9.5 })
    ]
  },
  {
    id: 'cover-issue',
    category: 'covers',
    build: (copy) => [
      text(copy('issue'), { ...mono, baseline: 13.5, size: 9, style: 'bold', width: COLUMN / 2 }),
      text(copy('date'), { ...mono, baseline: 13.5, size: 9, align: 'right', x: LEFT + COLUMN / 2, width: COLUMN / 2 }),
      text(copy('title'), { ...display, baseline: 43, size: 35, lineHeight: 1.04 }),
      text(copy('deck'), { baseline: 65, size: 10.5, color: SUB, lineHeight: 1.35 }),
      text(copy('footer'), { ...mono, baseline: 95, size: 8.5 })
    ]
  },
  {
    id: 'cover-framed',
    category: 'covers',
    build: (copy) => [
      text(copy('title'), { ...display, ...centered, baseline: 17.5, size: 21 }),
      frame(8.5, 23, W - 17, 59, INK, 0.5),
      text(copy('by'), { ...mono, baseline: 93, size: 9.5, x: 9, width: 9 }),
      rule(18, W - 9, 93.5, INK, 0.35)
    ]
  },
  {
    id: 'cover-notebook',
    category: 'covers',
    build: (copy) => [
      frame(LEFT, 9.5, COLUMN, 86, INK, 0.48),
      text(copy('title'), { ...display, ...centered, baseline: 39, size: 23 }),
      rule(21, W - 21, 44, INK, 0.4),
      text(copy('edition'), { ...mono, ...centered, baseline: 51, size: 9 }),
      rule(17, W - 17, 81),
      rule(17, W - 17, 87)
    ]
  },
  {
    id: 'cover-planner',
    category: 'covers',
    build: (copy) => [
      text(copy('kicker'), { ...mono, baseline: 15.5, size: 8.5 }),
      text(copy('title'), { ...display, baseline: 30, size: 30 }),
      rule(LEFT, RIGHT, 34, INK, 0.5),
      text(copy('date'), { ...mono, baseline: 43, size: 9, width: 12 }),
      rule(21, RIGHT, 43.5, RULE_GREY, 0.35),
      frame(LEFT, 51, COLUMN, 42, INK, 0.42),
      text(copy('focus'), { ...mono, baseline: 56.8, size: 8, style: 'bold', x: 11, width: COLUMN - 6 }),
      ...range(4).map((index) => rule(11, W - 11, 65 + index * 7.2, RULE_GREY, 0.28))
    ]
  },

  // ── Editorial and text ──────────────────────────────────────────────────
  {
    id: 'title-body',
    category: 'editorial',
    build: (copy) => [
      text(copy('title'), { baseline: 18, size: 18.5, style: 'bold' }),
      text(copy('body'), { baseline: 28, size: 10, font: 'Georgia', color: SUB, lineHeight: 1.44 }),
      text(copy('folio'), { ...mono, ...centered, baseline: 97, size: 8, color: RULE_GREY })
    ]
  },
  {
    id: 'pull-quote',
    category: 'editorial',
    build: (copy) => [
      text('“', { ...centered, baseline: 34, size: 34, font: 'Georgia', color: RULE_GREY, lineHeight: 1 }),
      text(copy('quote'), { ...centered, baseline: 44, size: 14.5, font: 'Georgia', style: 'italic', lineHeight: 1.33 }),
      text(copy('credit'), { ...mono, ...centered, baseline: 76, size: 9 })
    ]
  },
  {
    id: 'two-part',
    category: 'editorial',
    build: (copy) => [
      text(copy('firstTitle'), { baseline: 17, size: 13.5, style: 'bold' }),
      text(copy('firstBody'), { baseline: 24, size: 10, color: SUB, lineHeight: 1.4 }),
      text(copy('secondTitle'), { baseline: 58, size: 13.5, style: 'bold' }),
      text(copy('secondBody'), { baseline: 65, size: 10, color: SUB, lineHeight: 1.4 })
    ]
  },
  {
    id: 'colophon',
    category: 'editorial',
    build: (copy) => [
      text(copy('title'), { ...centered, baseline: 55, size: 13, style: 'bold' }),
      text(copy('credits'), { ...mono, ...centered, baseline: 79, size: 9, lineHeight: 1.55 })
    ]
  },

  // ── Print and write ─────────────────────────────────────────────────────
  {
    id: 'story-page',
    category: 'structured',
    build: () => [
      frame(LEFT, 8.5, COLUMN, 50),
      ...range(4).map((index) => rule(LEFT, RIGHT, 68 + index * 9.2, RULE_GREY, 0.35))
    ]
  },
  {
    id: 'story-back',
    category: 'structured',
    build: (copy) => [
      text(copy('title'), { ...display, ...centered, baseline: 24, size: 21 }),
      ring(W / 2, 49, 15),
      text(copy('about'), { ...mono, ...centered, baseline: 73, size: 9 }),
      rule(10, W - 10, 82.5),
      rule(10, W - 10, 91)
    ]
  },
  {
    id: 'checklist',
    category: 'structured',
    build: (copy) => [
      text(copy('title'), { ...display, baseline: 15, size: 14.5 }),
      rule(LEFT, RIGHT, 18, INK, 0.45),
      ...range(8).flatMap((index) => {
        const y = 25 + index * 9.3
        return [frame(LEFT, y - 3.6, 4, 4, INK, 0.35), rule(14.5, RIGHT, y + 0.4, RULE_GREY, 0.3)]
      })
    ]
  },
  {
    id: 'daily-schedule',
    category: 'structured',
    build: (copy) => [
      text(copy('title'), { ...display, baseline: 14.5, size: 14.5, width: COLUMN / 2 }),
      text(copy('date'), { ...mono, baseline: 14.5, size: 8.5, align: 'right', x: LEFT + COLUMN / 2, width: COLUMN / 2 }),
      rule(LEFT, RIGHT, 17.5, INK, 0.45),
      ...(['morning', 'afternoon', 'evening'] as const).flatMap((key, index) => {
        const y = 21 + index * 25
        return [
          frame(LEFT, y, COLUMN, 22, RULE_GREY, 0.35),
          text(copy(key), { ...mono, baseline: y + 4.5, size: 7.5, style: 'bold', x: 10.5, width: COLUMN - 5 }),
          rule(10.5, W - 10.5, y + 11, FAINT_GREY, 0.25),
          rule(10.5, W - 10.5, y + 17, FAINT_GREY, 0.25)
        ]
      })
    ]
  },
  {
    id: 'priorities-notes',
    category: 'structured',
    build: (copy) => [
      text(copy('title'), { ...display, baseline: 14.5, size: 14 }),
      rule(LEFT, RIGHT, 17.5, INK, 0.45),
      ...range(3).flatMap((index) => {
        const y = 25 + index * 10
        return [
          ring(10.6, y - 1.2, 2.4, 0.36),
          // One line of 8 pt, its box centred on the ring.
          text(String(index + 1), {
            ...centered,
            font: 'Courier New',
            style: 'bold',
            size: 8,
            lineHeight: 1,
            baseline: y - 1.2 + 0.35 * 8 / PT_PER_MM,
            x: 8.2,
            width: 4.8
          }),
          rule(15.8, RIGHT, y + 0.5)
        ]
      }),
      text(copy('notes'), { ...mono, baseline: 58, size: 10, style: 'bold' }),
      ...range(5).map((index) => rule(LEFT, RIGHT, 65 + index * 7.5, RULE_GREY, 0.28))
    ]
  },
  {
    id: 'tomorrow-back',
    category: 'structured',
    build: (copy) => [
      text(copy('title'), { ...display, baseline: 15, size: 14 }),
      rule(LEFT, RIGHT, 18, INK, 0.45),
      ...range(6).flatMap((index) => {
        const y = 25 + index * 7.8
        return [frame(LEFT, y - 3.3, 3.6, 3.6, INK, 0.32), rule(14, RIGHT, y + 0.3, RULE_GREY, 0.28)]
      }),
      frame(LEFT, 73, COLUMN, 22, RULE_GREY, 0.38),
      text(copy('later'), { ...mono, baseline: 78, size: 7.5, style: 'bold', x: 10.5, width: COLUMN - 5 })
    ]
  },

  // ── Paper ───────────────────────────────────────────────────────────────
  {
    id: 'lined',
    category: 'paper',
    // 13 rules, 7 mm apart.
    build: () => [pattern('lined', 7.5, 13, W - 15, 84)]
  },
  {
    id: 'dot-grid',
    category: 'paper',
    // 12 × 18 dots, 5 mm apart, centred on the panel.
    build: () => [pattern('dot-grid', (W - 55) / 2, 10, 55, 85)]
  }
] as const satisfies readonly PageLayout[]

export type PageLayoutId = typeof PAGE_LAYOUTS[number]['id']

export function getPageLayout(id: string): PageLayout | undefined {
  return PAGE_LAYOUTS.find((layout) => layout.id === id)
}
