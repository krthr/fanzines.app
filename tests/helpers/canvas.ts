import type { Browser } from '@e2e-dev/web'
import type { Editor } from './editor'

export async function waitForKonvaFrame(browser: Browser) {
  await browser.evaluate(() => new Promise<null>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
  }))
}

// Mirrors app/utils/zineLayout.ts so E2E tests stay decoupled from Nuxt app path aliases.
const A4_W_MM = 297
const A4_H_MM = 210
export const PANEL_W_MM = A4_W_MM / 4
export const PANEL_H_MM = A4_H_MM / 2
export const PAGE_W = 1000
export const PAGE_H = PAGE_W * (PANEL_H_MM / PANEL_W_MM)
const MM_PER_UNIT = PANEL_W_MM / PAGE_W
export const SAFE_MARGIN_MM = 5

const ROTATE_ANCHOR_OFFSET_DESKTOP = 24
const ROTATE_ANCHOR_OFFSET_COMPACT = 30

type Point = {
  x: number
  y: number
}

type Rgba = {
  r: number
  g: number
  b: number
  a: number
}

export type ElementBox = {
  x: number
  y: number
  width: number
  height: number
}

export function unitsToMm(units: number): number {
  return units * MM_PER_UNIT
}

export function mmToUnits(mm: number): number {
  return mm / MM_PER_UNIT
}

// Convert the page's 1000-unit coordinate space to CSS viewport pixels.
export async function pagePoint(editor: Editor, x: number, y: number): Promise<Point> {
  const box = await editor.screen.getByTestId('active-page').boundingBox()
  if (!box || box.width <= 0 || box.height <= 0) throw new Error('Active page has no measurable bounding box')
  const scale = box.width / PAGE_W
  return { x: box.x + x * scale, y: box.y + y * scale }
}

// Use touch events on the compact canvas so Konva exercises its touch handlers.
// Define the touch lists explicitly: WebKit does not expose a Touch constructor here.
async function touchGesture(browser: Browser, start: Point, end: Point, steps: number, taps = 1) {
  await browser.evaluate(async ({ start, end, steps, taps }) => {
    const target = document.elementFromPoint(start.x, start.y)
    if (!target) throw new Error('No element at the start of the touch gesture')

    const dispatch = (type: string, point: Point) => {
      const touch = {
        identifier: 1, target, clientX: point.x, clientY: point.y,
        pageX: point.x + window.scrollX, pageY: point.y + window.scrollY,
        screenX: point.x, screenY: point.y
      }
      const active = type === 'touchend' ? [] : [touch]
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        touches: { value: active }, targetTouches: { value: active }, changedTouches: { value: [touch] }
      })
      target.dispatchEvent(event)
    }
    for (let tap = 0; tap < taps; tap++) {
      dispatch('touchstart', start)
      for (let step = 1; step <= steps; step++) {
        const t = step / steps
        dispatch('touchmove', { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t })
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      }
      dispatch('touchend', end)
    }
    return null
  }, { start, end, steps, taps })
}

export async function tapCanvas(editor: Editor, point: Point, double = false) {
  await waitForKonvaFrame(editor.browser)
  if (!editor.desktop) await touchGesture(editor.browser, point, point, 0, double ? 2 : 1)
  else if (double) await editor.screen.doubleTapAt(point)
  else await editor.screen.tapAt(point)
}

export async function transformerHandlePoint(editor: Editor, box: ElementBox, handle: 'bottom-right' | 'middle-right' | 'rotater') {
  if (handle === 'rotater') {
    const top = await pagePoint(editor, box.x + box.width / 2, box.y)
    return { x: top.x, y: top.y - (editor.desktop ? ROTATE_ANCHOR_OFFSET_DESKTOP : ROTATE_ANCHOR_OFFSET_COMPACT) }
  }
  return pagePoint(editor, box.x + box.width, box.y + (handle === 'bottom-right' ? box.height : box.height / 2))
}

export async function dragBetween(editor: Editor, from: Point, to: Point, steps = 12) {
  await waitForKonvaFrame(editor.browser)
  if (editor.desktop) {
    const { mouse } = editor.browser
    await mouse.move(from.x, from.y)
    await mouse.down()
    try {
      for (let step = 1; step <= steps; step++) {
        const t = step / steps
        await mouse.move(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)
      }
    } finally {
      await mouse.up()
    }
  } else {
    await touchGesture(editor.browser, from, to, steps)
  }
  await waitForKonvaFrame(editor.browser)
}

export async function dragPagePoints(editor: Editor, from: Point, to: Point) {
  const start = await pagePoint(editor, from.x, from.y)
  const end = await pagePoint(editor, to.x, to.y)
  await dragBetween(editor, start, end)
}

/**
 * Samples the Konva scene `<canvas>` pixel color (`rgba`) at a zine coordinate `(x, y)`.
 * Accounts for `stagePad` offset and `devicePixelRatio` backing-store scaling.
 */
export async function readCanvasPixel(editor: Editor, x: number, y: number): Promise<Rgba> {
  return editor.browser.evaluate(
    async ({ pageX, pageY, pageW }) => {
      const el = document.querySelector('[data-testid="active-page"]')
      if (!el) throw new Error('Active page missing')
      // Wait for Konva's batchDraw requestAnimationFrame to flush before sampling.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

      const canvas = el.querySelector<HTMLCanvasElement>('.stage canvas')
      if (!canvas) {
        throw new Error('Konva canvas element not found inside active page')
      }

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Could not acquire 2D context for Konva canvas')
      }

      const pageRect = el.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()
      const scale = pageRect.width / pageW

      const viewportX = pageRect.left + pageX * scale
      const viewportY = pageRect.top + pageY * scale

      const ratioX = canvas.width / canvasRect.width
      const ratioY = canvas.height / canvasRect.height

      const px = Math.min(canvas.width - 1, Math.max(0, Math.round((viewportX - canvasRect.left) * ratioX)))
      const py = Math.min(canvas.height - 1, Math.max(0, Math.round((viewportY - canvasRect.top) * ratioY)))

      const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(px, py, 1, 1).data
      return { r, g, b, a }
    },
    { pageX: x, pageY: y, pageW: PAGE_W }
  )
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const clean = hex.replace(/^#/, '')
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16)
  }
}

export function isPixelCloseTo(pixel: Rgba, hex: string, tolerance = 12): boolean {
  const target = hexToRgb(hex)
  return (
    pixel.a >= 245
    && Math.abs(pixel.r - target.r) <= tolerance
    && Math.abs(pixel.g - target.g) <= tolerance
    && Math.abs(pixel.b - target.b) <= tolerance
  )
}
