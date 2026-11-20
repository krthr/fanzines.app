import { deflateSync } from 'node:zlib'
import { expect, type Page } from '@playwright/test'

// Mirrors app/utils/zineLayout.ts so E2E tests stay decoupled from Nuxt app path aliases.
export const A4_W_MM = 297
export const A4_H_MM = 210
export const PANEL_W_MM = A4_W_MM / 4
export const PANEL_H_MM = A4_H_MM / 2
export const PAGE_W = 1000
export const PAGE_H = PAGE_W * (PANEL_H_MM / PANEL_W_MM)
export const MM_PER_UNIT = PANEL_W_MM / PAGE_W
export const SAFE_MARGIN_MM = 5
export const SAFE_MARGIN = SAFE_MARGIN_MM / MM_PER_UNIT

export const STAGE_PAD_DESKTOP = 40
export const ROTATE_ANCHOR_OFFSET_DESKTOP = 24
export const ROTATE_ANCHOR_OFFSET_COMPACT = 30

export type Point = {
  x: number
  y: number
}

export type Rgba = {
  r: number
  g: number
  b: number
  a: number
}

export type PageBox = {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export type ElementBox = {
  x: number
  y: number
  width: number
  height: number
}

export type TransformerHandle =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'rotater'

export function unitsToMm(units: number): number {
  return units * MM_PER_UNIT
}

export function mmToUnits(mm: number): number {
  return mm / MM_PER_UNIT
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Returns the live viewport box and uniform Konva scale (`pageWidth / PAGE_W`)
 * of the active zine page (`[data-testid="active-page"]` / `.page-active`).
 */
export async function activePageBox(page: Page): Promise<PageBox> {
  const activePage = page.getByTestId('active-page')
  await expect(activePage).toBeVisible()

  const box = await activePage.boundingBox()
  if (!box || box.width <= 0 || box.height <= 0) {
    throw new Error('Active zine page has no measurable bounding box')
  }

  return {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    scale: box.width / PAGE_W
  }
}

/**
 * Converts zine page units (`0..PAGE_W`, `0..PAGE_H`, or overhanging coordinates)
 * into viewport pixel coordinates using the active page's live bounding box.
 */
export async function pagePoint(page: Page, x: number, y: number): Promise<Point> {
  const box = await activePageBox(page)

  return {
    x: box.x + x * box.scale,
    y: box.y + y * box.scale
  }
}

/**
 * Computes the viewport coordinates of a Konva Transformer handle for an unrotated
 * element box expressed in zine page units.
 */
export async function transformerHandlePoint(
  page: Page,
  elementBox: ElementBox,
  handle: TransformerHandle,
  options: { compact?: boolean } = {}
): Promise<Point> {
  const { x, y, width, height } = elementBox
  const cx = x + width / 2
  const cy = y + height / 2

  switch (handle) {
    case 'top-left':
      return pagePoint(page, x, y)
    case 'top-center':
      return pagePoint(page, cx, y)
    case 'top-right':
      return pagePoint(page, x + width, y)
    case 'middle-left':
      return pagePoint(page, x, cy)
    case 'middle-right':
      return pagePoint(page, x + width, cy)
    case 'bottom-left':
      return pagePoint(page, x, y + height)
    case 'bottom-center':
      return pagePoint(page, cx, y + height)
    case 'bottom-right':
      return pagePoint(page, x + width, y + height)
    case 'rotater': {
      const topCenter = await pagePoint(page, cx, y)
      const offset = options.compact ? ROTATE_ANCHOR_OFFSET_COMPACT : ROTATE_ANCHOR_OFFSET_DESKTOP
      return { x: topCenter.x, y: topCenter.y - offset }
    }
  }
}

/**
 * Samples the Konva scene `<canvas>` pixel color (`rgba`) at a zine coordinate `(x, y)`.
 * Accounts for `stagePad` offset and `devicePixelRatio` backing-store scaling.
 */
export async function readCanvasPixel(page: Page, x: number, y: number): Promise<Rgba> {
  const activePage = page.getByTestId('active-page')
  await expect(activePage).toBeVisible()

  return activePage.evaluate(
    async (el, { pageX, pageY, pageW }) => {
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

export function hexToRgb(hex: string): { r: number, g: number, b: number } {
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

/**
 * Waits for a Konva canvas frame so recently attached Transformers and hit graphs settle
 * before sending pointer/touch gestures.
 */
export async function waitForKonvaFrame(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  )
}

/**
 * Drags smoothly between two viewport coordinates using desktop mouse events
 * or touch events (`touchstart` / `touchmove` / `touchend`) on mobile touch devices.
 */
export async function dragBetween(
  page: Page,
  from: Point,
  to: Point,
  options: { steps?: number, touch?: boolean } = {}
): Promise<void> {
  const steps = options.steps ?? 12

  await waitForKonvaFrame(page)

  if (!options.touch) {
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps })
    await page.mouse.up()
    await waitForKonvaFrame(page)
    return
  }

  // Playwright's touchscreen API exposes tap() but not a continuous touch drag, so
  // dispatch touchstart/touchmove/touchend events matching Konva's stage/window listeners.
  // WebKit blocks `new Touch()`, so we define touches/changedTouches directly on Event.
  await page.evaluate(
    async ({ start, end, moveSteps }) => {
      const target = document.elementFromPoint(start.x, start.y)
        ?? document.querySelector('[data-testid="active-page"] .konvajs-content')
      if (!target) {
        throw new Error(`No element found at touch start (${start.x}, ${start.y})`)
      }

      const makeTouch = (x: number, y: number) => ({
        identifier: 1,
        target,
        clientX: x,
        clientY: y,
        pageX: x + window.scrollX,
        pageY: y + window.scrollY,
        screenX: x,
        screenY: y
      })

      const dispatchTouch = (
        type: 'touchstart' | 'touchmove' | 'touchend',
        activeTouches: ReturnType<typeof makeTouch>[],
        changedTouches: ReturnType<typeof makeTouch>[]
      ) => {
        const event = new Event(type, { bubbles: true, cancelable: true })
        Object.defineProperties(event, {
          touches: { value: activeTouches },
          targetTouches: { value: activeTouches },
          changedTouches: { value: changedTouches }
        })
        target.dispatchEvent(event)
      }

      const startTouch = makeTouch(start.x, start.y)
      dispatchTouch('touchstart', [startTouch], [startTouch])

      for (let step = 1; step <= moveSteps; step += 1) {
        const t = step / moveSteps
        const x = start.x + (end.x - start.x) * t
        const y = start.y + (end.y - start.y) * t
        const moveTouch = makeTouch(x, y)

        dispatchTouch('touchmove', [moveTouch], [moveTouch])
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      }

      const endTouch = makeTouch(end.x, end.y)
      dispatchTouch('touchend', [], [endTouch])
    },
    { start: from, end: to, moveSteps: steps }
  )

  await waitForKonvaFrame(page)
}

/**
 * Convenience helper to drag between two coordinates expressed in zine page units.
 */
export async function dragPagePoints(
  page: Page,
  from: Point,
  to: Point,
  options: { steps?: number, touch?: boolean } = {}
): Promise<void> {
  const start = await pagePoint(page, from.x, from.y)
  const end = await pagePoint(page, to.x, to.y)
  await dragBetween(page, start, end, options)
}

/**
 * Performs a double-tap at a viewport point to trigger Konva's `dbltap` gesture on mobile.
 */
export async function doubleTapAt(page: Page, point: Point): Promise<void> {
  await waitForKonvaFrame(page)
  await page.touchscreen.tap(point.x, point.y)
  await page.touchscreen.tap(point.x, point.y)
}

// ── Minimal PNG generator for deterministic image upload tests ────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Uint8Array): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const crcInput = Buffer.concat([typeBytes, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)

  return Buffer.concat([length, typeBytes, data, crc])
}

/**
 * Generates a valid uncompressed-filter solid RGB PNG buffer of exact pixel dimensions.
 */
export function createSolidPngBuffer(width: number, height: number, hexColor: string): Buffer {
  const { r, g, b } = hexToRgb(hexColor)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const stride = 1 + width * 3
  const raw = Buffer.alloc(stride * height)
  for (let row = 0; row < height; row += 1) {
    const rowStart = row * stride
    raw[rowStart] = 0 // filter type: None
    for (let col = 0; col < width; col += 1) {
      const offset = rowStart + 1 + col * 3
      raw[offset] = r
      raw[offset + 1] = g
      raw[offset + 2] = b
    }
  }

  const compressed = deflateSync(raw)

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}
