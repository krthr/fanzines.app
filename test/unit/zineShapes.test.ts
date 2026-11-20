import { describe, expect, it } from 'vitest'
import {
  NO_PAINT,
  PATTERN_KINDS,
  type CircleElement,
  type LineElement,
  type PatternElement,
  type RectElement
} from '~/types/zine'
import { PAGE_H, PAGE_W, mmToUnits, unitsToMm } from '~/utils/zineLayout'
import {
  DEFAULT_STROKE_WIDTH,
  MIN_PATTERN_SPACING,
  PATTERN_PRESETS,
  SHAPE_INK,
  circleNodeConfig,
  createShapeDraft,
  getLineDash,
  getPatternGeometry,
  hasPaint,
  lineNodeConfig,
  patternNodeConfig,
  rectNodeConfig
} from '~/utils/zineShapes'

describe('zineShapes', () => {
  describe('hasPaint', () => {
    it('returns false for empty, undefined and transparent values', () => {
      expect(hasPaint(undefined)).toBe(false)
      expect(hasPaint('')).toBe(false)
      expect(hasPaint(NO_PAINT)).toBe(false)
    })

    it('returns true for concrete paint colors', () => {
      expect(hasPaint(SHAPE_INK)).toBe(true)
      expect(hasPaint('#ffffff')).toBe(true)
      expect(hasPaint('#d25a36')).toBe(true)
    })
  })

  describe('createShapeDraft', () => {
    it('creates a centered 40x30 mm unfilled rectangle draft', () => {
      const draft = createShapeDraft('rect')

      expect(draft.type).toBe('rect')
      if (draft.type !== 'rect') return

      expect(unitsToMm(draft.width)).toBeCloseTo(40, 8)
      expect(unitsToMm(draft.height)).toBeCloseTo(30, 8)
      expect(draft.x + draft.width / 2).toBeCloseTo(PAGE_W / 2, 8)
      expect(draft.y + draft.height / 2).toBeCloseTo(PAGE_H / 2, 8)
      expect(draft.fill).toBe(NO_PAINT)
      expect(draft.stroke).toBe(SHAPE_INK)
      expect(draft.strokeWidth).toBe(DEFAULT_STROKE_WIDTH)
      expect(draft.rotation).toBe(0)
      expect(draft.opacity).toBe(1)
    })

    it('creates a centered 30x30 mm unfilled circle draft', () => {
      const draft = createShapeDraft('circle')

      expect(draft.type).toBe('circle')
      if (draft.type !== 'circle') return

      expect(unitsToMm(draft.width)).toBeCloseTo(30, 8)
      expect(unitsToMm(draft.height)).toBeCloseTo(30, 8)
      expect(draft.x + draft.width / 2).toBeCloseTo(PAGE_W / 2, 8)
      expect(draft.y + draft.height / 2).toBeCloseTo(PAGE_H / 2, 8)
      expect(draft.fill).toBe(NO_PAINT)
      expect(draft.stroke).toBe(SHAPE_INK)
      expect(draft.strokeWidth).toBe(DEFAULT_STROKE_WIDTH)
    })

    it('creates a centered 50 mm horizontal line draft with zero height', () => {
      const draft = createShapeDraft('line')

      expect(draft.type).toBe('line')
      if (draft.type !== 'line') return

      expect(unitsToMm(draft.width)).toBeCloseTo(50, 8)
      expect(draft.height).toBe(0)
      expect(draft.x + draft.width / 2).toBeCloseTo(PAGE_W / 2, 8)
      expect(draft.y).toBeCloseTo(PAGE_H / 2, 8)
      expect(draft.stroke).toBe(SHAPE_INK)
      expect(draft.strokeWidth).toBe(DEFAULT_STROKE_WIDTH)
      expect('fill' in draft).toBe(false)
    })
  })

  describe('getLineDash', () => {
    it('returns undefined for solid lines', () => {
      expect(getLineDash({ dash: undefined, strokeWidth: DEFAULT_STROKE_WIDTH })).toBeUndefined()
    })

    it('returns zero-length dots spaced by 2x stroke width for dotted lines', () => {
      const strokeWidth = mmToUnits(0.6)
      expect(getLineDash({ dash: 'dotted', strokeWidth })).toEqual([0, strokeWidth * 2])
    })

    it('enforces a minimum dash and gap for thin dashed lines', () => {
      const dash = getLineDash({ dash: 'dashed', strokeWidth: mmToUnits(0.2) })
      expect(dash).toBeDefined()
      expect(dash![0]).toBeCloseTo(mmToUnits(1.6), 8)
      expect(dash![1]).toBeCloseTo(mmToUnits(1.2), 8)
    })

    it('scales dashes proportionally for thick dashed lines', () => {
      const strokeWidth = mmToUnits(1.2)
      const dash = getLineDash({ dash: 'dashed', strokeWidth })
      expect(dash).toEqual([strokeWidth * 4, strokeWidth * 3])
    })
  })

  describe('PATTERN_PRESETS', () => {
    it('defines a valid preset for every pattern kind', () => {
      expect(Object.keys(PATTERN_PRESETS).sort()).toEqual([...PATTERN_KINDS].sort())

      for (const kind of PATTERN_KINDS) {
        const preset = PATTERN_PRESETS[kind]
        expect(preset.spacing).toBeGreaterThanOrEqual(MIN_PATTERN_SPACING)
        expect(preset.strokeWidth).toBeGreaterThan(0)
        expect(hasPaint(preset.stroke)).toBe(true)
      }

      expect(unitsToMm(PATTERN_PRESETS.lined.spacing)).toBeCloseTo(7, 8)
      expect(unitsToMm(PATTERN_PRESETS['dot-grid'].spacing)).toBeCloseTo(5, 8)
      expect(unitsToMm(PATTERN_PRESETS['square-grid'].spacing)).toBeCloseTo(5, 8)
    })
  })

  describe('getPatternGeometry', () => {
    it('returns empty geometry when width or height is zero', () => {
      expect(getPatternGeometry({ pattern: 'lined', spacing: mmToUnits(5), width: 0, height: 100 })).toEqual({
        lines: [],
        dots: []
      })
      expect(getPatternGeometry({ pattern: 'dot-grid', spacing: mmToUnits(5), width: 100, height: 0 })).toEqual({
        lines: [],
        dots: []
      })
    })

    it('builds centered horizontal rules for lined paper', () => {
      // Matches the lined page layout: 84 mm tall at 7 mm spacing -> 13 lines from 0 to 84 mm.
      const width = mmToUnits(59.25)
      const height = mmToUnits(84)
      const spacing = mmToUnits(7)
      const geometry = getPatternGeometry({ pattern: 'lined', spacing, width, height })

      expect(geometry.dots).toEqual([])
      expect(geometry.lines).toHaveLength(13)
      expect(geometry.lines[0]![0]).toBe(0)
      expect(geometry.lines[0]![2]).toBeCloseTo(width, 8)
      expect(geometry.lines[0]![1]).toBeCloseTo(0, 8)
      expect(geometry.lines.at(-1)![1]).toBeCloseTo(height, 8)
    })

    it('centers marks when the block size is not an exact multiple of spacing', () => {
      const spacing = mmToUnits(5)
      const height = mmToUnits(16)
      const width = mmToUnits(20)
      const geometry = getPatternGeometry({ pattern: 'lined', spacing, width, height })

      // 3 gaps = 15 mm inside 16 mm -> 0.5 mm offset on top and bottom.
      expect(geometry.lines).toHaveLength(4)
      for (const [index, expectedY] of [0.5, 5.5, 10.5, 15.5].entries()) {
        expect(unitsToMm(geometry.lines[index]![1])).toBeCloseTo(expectedY, 8)
      }
    })

    it('builds a full centered dot matrix for dot-grid paper', () => {
      // Matches the dot-grid page layout: 55 x 85 mm at 5 mm spacing -> 12 x 18 = 216 dots.
      const geometry = getPatternGeometry({
        pattern: 'dot-grid',
        spacing: mmToUnits(5),
        width: mmToUnits(55),
        height: mmToUnits(85)
      })

      expect(geometry.lines).toEqual([])
      expect(geometry.dots).toHaveLength(12 * 18)
      expect(geometry.dots[0]![0]).toBeCloseTo(0, 8)
      expect(geometry.dots[0]![1]).toBeCloseTo(0, 8)
      expect(geometry.dots.at(-1)![0]).toBeCloseTo(mmToUnits(55), 8)
      expect(geometry.dots.at(-1)![1]).toBeCloseTo(mmToUnits(85), 8)
    })

    it('builds both vertical and horizontal lines for square-grid paper, including a cross when smaller than one square', () => {
      const grid = getPatternGeometry({
        pattern: 'square-grid',
        spacing: mmToUnits(5),
        width: mmToUnits(10),
        height: mmToUnits(15)
      })
      // 3 columns + 4 rows = 7 lines
      expect(grid.dots).toEqual([])
      expect(grid.lines).toHaveLength(7)

      const small = getPatternGeometry({
        pattern: 'square-grid',
        spacing: mmToUnits(10),
        width: mmToUnits(4),
        height: mmToUnits(6)
      })
      expect(small.lines).toHaveLength(2)
      for (const [index, expected] of [2, 0, 2, 6].entries()) {
        expect(unitsToMm(small.lines[0]![index]!)).toBeCloseTo(expected, 8)
      }
      for (const [index, expected] of [0, 3, 4, 3].entries()) {
        expect(unitsToMm(small.lines[1]![index]!)).toBeCloseTo(expected, 8)
      }
    })

    it('clamps spacing below MIN_PATTERN_SPACING and handles negative dimensions safely', () => {
      const size = MIN_PATTERN_SPACING * 2
      const clamped = getPatternGeometry({
        pattern: 'lined',
        spacing: 0,
        width: -size,
        height: -size
      })

      expect(clamped.lines).toHaveLength(3)
      expect(clamped.lines[0]![2]).toBeCloseTo(size, 8)
      expect(clamped.lines.at(-1)![1]).toBeCloseTo(size, 8)
    })
  })

  describe('Konva node config helpers', () => {
    it('disables fill or stroke on rect and circle configs when set to NO_PAINT', () => {
      const rect: RectElement = {
        id: 'r1',
        pageId: 'p1',
        type: 'rect',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 15,
        opacity: 0.8,
        fill: NO_PAINT,
        stroke: SHAPE_INK,
        strokeWidth: DEFAULT_STROKE_WIDTH
      }
      const rectConfig = rectNodeConfig(rect)
      expect(rectConfig.fill).toBeUndefined()
      expect(rectConfig.fillEnabled).toBe(false)
      expect(rectConfig.stroke).toBe(SHAPE_INK)
      expect(rectConfig.strokeEnabled).toBe(true)

      const circle: CircleElement = {
        ...rect,
        id: 'c1',
        type: 'circle',
        fill: '#d25a36',
        stroke: NO_PAINT
      }
      const circleConfig = circleNodeConfig(circle)
      expect(circleConfig.fill).toBe('#d25a36')
      expect(circleConfig.fillEnabled).toBe(true)
      expect(circleConfig.stroke).toBeUndefined()
      expect(circleConfig.strokeEnabled).toBe(false)
      expect(typeof circleConfig.sceneFunc).toBe('function')
    })

    it('centers lineNodeConfig vertically on its hit band and picks round caps for dotted lines', () => {
      const line: LineElement = {
        id: 'l1',
        pageId: 'p1',
        type: 'line',
        x: 10,
        y: 20,
        width: 200,
        height: 0,
        rotation: 0,
        opacity: 1,
        stroke: SHAPE_INK,
        strokeWidth: 4,
        dash: 'dotted'
      }

      const withBand = lineNodeConfig(line, 20)
      expect(withBand.height).toBe(20)
      expect(withBand.offsetY).toBe(10)
      expect(withBand.lineCap).toBe('round')
      expect(withBand.dash).toEqual([0, 8])

      const solid = lineNodeConfig({ ...line, dash: undefined }, 1)
      expect(solid.height).toBe(4)
      expect(solid.offsetY).toBe(2)
      expect(solid.lineCap).toBe('butt')
      expect(solid.dash).toBeUndefined()
    })

    it('switches between fill and stroke for dot-grid vs ruled pattern configs', () => {
      const base: Omit<PatternElement, 'pattern'> = {
        id: 'pat1',
        pageId: 'p1',
        type: 'pattern',
        x: 0,
        y: 0,
        width: 500,
        height: 700,
        rotation: 0,
        opacity: 1,
        spacing: mmToUnits(5),
        stroke: '#9c968b',
        strokeWidth: mmToUnits(0.5)
      }

      const dotConfig = patternNodeConfig({ ...base, pattern: 'dot-grid' })
      expect(dotConfig.fill).toBe('#9c968b')
      expect(dotConfig.stroke).toBeUndefined()

      const linedConfig = patternNodeConfig({ ...base, pattern: 'lined' })
      expect(linedConfig.fill).toBeUndefined()
      expect(linedConfig.stroke).toBe('#9c968b')
    })
  })
})
