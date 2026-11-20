import { describe, expect, it } from 'vitest'
import { PAGE_IDS, type PageId } from '~/types/zine'
import {
  A4_H_MM,
  A4_W_MM,
  IMPOSED_PAGE_IDS,
  IMPOSITION_SLOTS,
  MM_PER_UNIT,
  PAGE_H,
  PAGE_W,
  PANEL_H_MM,
  PANEL_SIZE_LABEL,
  PANEL_W_MM,
  PT_PER_UNIT,
  READING_SPREADS,
  SAFE_MARGIN,
  SAFE_MARGIN_MM,
  clampToPage,
  formatElementSize,
  formatMmSize,
  getFacingPageId,
  getImposedGroupTransform,
  getPageSide,
  getRotatedBounds,
  mmToUnits,
  ptToUnits,
  unitsToMm,
  unitsToPt
} from '~/utils/zineLayout'

describe('zineLayout', () => {
  describe('sheet geometry and imposition slots', () => {
    it('defines an 8-panel A4 landscape grid matching the physical fold', () => {
      expect(PANEL_W_MM).toBeCloseTo(A4_W_MM / 4)
      expect(PANEL_H_MM).toBeCloseTo(A4_H_MM / 2)
      expect(PAGE_H / PAGE_W).toBeCloseTo(PANEL_H_MM / PANEL_W_MM)

      expect(IMPOSED_PAGE_IDS).toHaveLength(PAGE_IDS.length)
      expect(new Set(IMPOSED_PAGE_IDS)).toEqual(new Set(PAGE_IDS))

      expect(IMPOSITION_SLOTS).toEqual({
        p6: { col: 0, row: 0, rotation: 180 },
        p5: { col: 1, row: 0, rotation: 180 },
        p4: { col: 2, row: 0, rotation: 180 },
        p3: { col: 3, row: 0, rotation: 180 },
        'back-cover': { col: 0, row: 1, rotation: 0 },
        'front-cover': { col: 1, row: 1, rotation: 0 },
        p1: { col: 2, row: 1, rotation: 0 },
        p2: { col: 3, row: 1, rotation: 0 }
      })
    })

    it('assigns each page to a distinct cell of the 4x2 A4 grid', () => {
      const cells = Object.values(IMPOSITION_SLOTS).map((slot) => `${slot.col},${slot.row}`)
      expect(new Set(cells).size).toBe(8)

      for (const slot of Object.values(IMPOSITION_SLOTS)) {
        expect(slot.col).toBeGreaterThanOrEqual(0)
        expect(slot.col).toBeLessThan(4)
        expect(slot.row === 0 || slot.row === 1).toBe(true)
        expect(slot.rotation).toBe(slot.row === 0 ? 180 : 0)
      }
    })
  })

  describe('getImposedGroupTransform', () => {
    it('flips top-row panels 180 degrees around their bottom-right cell corner', () => {
      for (const pageId of ['p6', 'p5', 'p4', 'p3'] as const) {
        const slot = IMPOSITION_SLOTS[pageId]
        expect(getImposedGroupTransform(slot)).toEqual({
          x: (slot.col + 1) * PANEL_W_MM,
          y: PANEL_H_MM,
          rotation: 180
        })
      }
    })

    it('places bottom-row panels upright at their top-left cell corner', () => {
      for (const pageId of ['back-cover', 'front-cover', 'p1', 'p2'] as const) {
        const slot = IMPOSITION_SLOTS[pageId]
        expect(getImposedGroupTransform(slot)).toEqual({
          x: slot.col * PANEL_W_MM,
          y: PANEL_H_MM,
          rotation: 0
        })
      }
    })

    it('maps every panel onto its exact A4 grid cell without gaps or overlap', () => {
      for (const pageId of IMPOSED_PAGE_IDS) {
        const slot = IMPOSITION_SLOTS[pageId]
        const transform = getImposedGroupTransform(slot)
        const bounds = getRotatedBounds({
          x: transform.x,
          y: transform.y,
          width: PANEL_W_MM,
          height: PANEL_H_MM,
          rotation: transform.rotation
        })

        expect(bounds.left).toBeCloseTo(slot.col * PANEL_W_MM, 8)
        expect(bounds.right).toBeCloseTo((slot.col + 1) * PANEL_W_MM, 8)
        expect(bounds.top).toBeCloseTo(slot.row * PANEL_H_MM, 8)
        expect(bounds.bottom).toBeCloseTo((slot.row + 1) * PANEL_H_MM, 8)
      }
    })
  })

  describe('getRotatedBounds', () => {
    it('returns the original box at 0 and 360 degrees', () => {
      const box = { x: 100, y: 200, width: 300, height: 150, rotation: 0 }

      expect(getRotatedBounds(box)).toEqual({ left: 100, right: 400, top: 200, bottom: 350 })

      const fullTurn = getRotatedBounds({ ...box, rotation: 360 })
      expect(fullTurn.left).toBeCloseTo(100, 8)
      expect(fullTurn.right).toBeCloseTo(400, 8)
      expect(fullTurn.top).toBeCloseTo(200, 8)
      expect(fullTurn.bottom).toBeCloseTo(350, 8)
    })

    it('rotates clockwise around the top-left corner for 90, 180 and -90 degrees', () => {
      const at90 = getRotatedBounds({ x: 100, y: 200, width: 300, height: 150, rotation: 90 })
      expect(at90.left).toBeCloseTo(-50, 8)
      expect(at90.right).toBeCloseTo(100, 8)
      expect(at90.top).toBeCloseTo(200, 8)
      expect(at90.bottom).toBeCloseTo(500, 8)

      const at180 = getRotatedBounds({ x: 100, y: 200, width: 300, height: 150, rotation: 180 })
      expect(at180.left).toBeCloseTo(-200, 8)
      expect(at180.right).toBeCloseTo(100, 8)
      expect(at180.top).toBeCloseTo(50, 8)
      expect(at180.bottom).toBeCloseTo(200, 8)

      const atMinus90 = getRotatedBounds({ x: 100, y: 200, width: 300, height: 150, rotation: -90 })
      expect(atMinus90.left).toBeCloseTo(100, 8)
      expect(atMinus90.right).toBeCloseTo(250, 8)
      expect(atMinus90.top).toBeCloseTo(-100, 8)
      expect(atMinus90.bottom).toBeCloseTo(200, 8)
    })

    it('computes diagonal bounds for arbitrary angles', () => {
      const diag = 100 * Math.SQRT1_2
      const bounds = getRotatedBounds({ x: 0, y: 0, width: 100, height: 100, rotation: 45 })

      expect(bounds.left).toBeCloseTo(-diag, 8)
      expect(bounds.right).toBeCloseTo(diag, 8)
      expect(bounds.top).toBeCloseTo(0, 8)
      expect(bounds.bottom).toBeCloseTo(2 * diag, 8)
    })

    it('handles zero-height elements such as lines', () => {
      const bounds = getRotatedBounds({ x: 50, y: 60, width: 200, height: 0, rotation: 90 })
      expect(bounds.left).toBeCloseTo(50, 8)
      expect(bounds.right).toBeCloseTo(50, 8)
      expect(bounds.top).toBeCloseTo(60, 8)
      expect(bounds.bottom).toBeCloseTo(260, 8)
    })
  })

  describe('clampToPage', () => {
    it('keeps values within [-max, 2 * max]', () => {
      expect(clampToPage(-1000, 1000)).toBe(-1000)
      expect(clampToPage(0, 1000)).toBe(0)
      expect(clampToPage(500, 1000)).toBe(500)
      expect(clampToPage(2000, 1000)).toBe(2000)
    })

    it('clamps values outside [-max, 2 * max]', () => {
      expect(clampToPage(-1500, 1000)).toBe(-1000)
      expect(clampToPage(2500, 1000)).toBe(2000)
      expect(clampToPage(-Infinity, 1000)).toBe(-1000)
      expect(clampToPage(Infinity, 1000)).toBe(2000)
    })

    it('falls back to 0 for NaN', () => {
      expect(clampToPage(Number.NaN, 1000)).toBe(0)
    })
  })

  describe('unit conversions', () => {
    it('round-trips between page units and millimetres', () => {
      expect(unitsToMm(PAGE_W)).toBeCloseTo(PANEL_W_MM, 10)
      expect(unitsToMm(PAGE_H)).toBeCloseTo(PANEL_H_MM, 10)
      expect(mmToUnits(SAFE_MARGIN_MM)).toBeCloseTo(SAFE_MARGIN, 10)

      for (const mm of [0, 0.5, 5, 25.4, 74.25, 105, -12.5]) {
        expect(unitsToMm(mmToUnits(mm))).toBeCloseTo(mm, 10)
      }

      for (const units of [0, 1, 50, PAGE_W, PAGE_H, -250]) {
        expect(mmToUnits(unitsToMm(units))).toBeCloseTo(units, 10)
      }
    })

    it('round-trips between page units and typographic points', () => {
      // 1 inch = 25.4 mm = 72 pt
      expect(unitsToPt(mmToUnits(25.4))).toBeCloseTo(72, 10)
      expect(PT_PER_UNIT).toBeCloseTo(MM_PER_UNIT * (72 / 25.4), 10)

      for (const pt of [0, 7.5, 12, 26, 72, -10]) {
        expect(unitsToPt(ptToUnits(pt))).toBeCloseTo(pt, 10)
      }

      for (const units of [0, 10, 120, PAGE_W]) {
        expect(ptToUnits(unitsToPt(units))).toBeCloseTo(units, 10)
      }
    })
  })

  describe('size formatting', () => {
    it('formats width and height in rounded millimetres', () => {
      expect(PANEL_SIZE_LABEL).toBe('74 × 105 mm')
      expect(formatMmSize(PAGE_W, PAGE_H)).toBe('74 × 105 mm')
      expect(formatMmSize(mmToUnits(10.4), mmToUnits(10.6))).toBe('10 × 11 mm')
    })

    it('formats lines with length only and other elements with width and height', () => {
      expect(formatElementSize('line', mmToUnits(50), 0)).toBe('50 mm')
      expect(formatElementSize('line', mmToUnits(50.4), mmToUnits(12))).toBe('50 mm')
      expect(formatElementSize('rect', mmToUnits(40), mmToUnits(30))).toBe('40 × 30 mm')
      expect(formatElementSize('circle', mmToUnits(30), mmToUnits(30))).toBe('30 × 30 mm')
      expect(formatElementSize('text', mmToUnits(58.25), mmToUnits(12.2))).toBe('58 × 12 mm')
    })
  })

  describe('reading spreads and facing pages', () => {
    it('covers every page once in reading order with solo covers', () => {
      expect(READING_SPREADS).toEqual([
        [null, 'front-cover'],
        ['p1', 'p2'],
        ['p3', 'p4'],
        ['p5', 'p6'],
        ['back-cover', null]
      ])

      const flattened = READING_SPREADS.flat().filter((pageId): pageId is PageId => pageId !== null)
      expect(flattened).toEqual([...PAGE_IDS])
    })

    it('returns the facing page for inner spreads and null for covers', () => {
      expect(getFacingPageId('front-cover')).toBeNull()
      expect(getFacingPageId('back-cover')).toBeNull()
      expect(getFacingPageId('p1')).toBe('p2')
      expect(getFacingPageId('p2')).toBe('p1')
      expect(getFacingPageId('p3')).toBe('p4')
      expect(getFacingPageId('p4')).toBe('p3')
      expect(getFacingPageId('p5')).toBe('p6')
      expect(getFacingPageId('p6')).toBe('p5')
    })

    it('returns the left or right side of each page in its spread', () => {
      const expectedSides: Record<PageId, 'left' | 'right'> = {
        'front-cover': 'right',
        p1: 'left',
        p2: 'right',
        p3: 'left',
        p4: 'right',
        p5: 'left',
        p6: 'right',
        'back-cover': 'left'
      }

      for (const pageId of PAGE_IDS) {
        expect(getPageSide(pageId)).toBe(expectedSides[pageId])
      }
    })
  })
})
