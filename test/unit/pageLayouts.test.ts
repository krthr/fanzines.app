import { describe, expect, it } from 'vitest'
import enUS from '~~/i18n/locales/en-US.json'
import esCO from '~~/i18n/locales/es-CO.json'
import { FONT_OPTIONS } from '~/types/zine'
import { PAGE_LAYOUTS, PAGE_LAYOUT_CATEGORIES, getPageLayout } from '~/utils/pageLayouts'
import { PAGE_H, PAGE_W, SAFE_MARGIN, getRotatedBounds, unitsToMm } from '~/utils/zineLayout'
import { MIN_PATTERN_SPACING, hasPaint } from '~/utils/zineShapes'

type LocaleLayouts = {
  categories: Record<string, string>
  names: Record<string, string>
  copy: Record<string, Record<string, string>>
}

const LOCALES: ReadonlyArray<readonly [string, LocaleLayouts]> = [
  ['es-CO', esCO.editor.layouts as LocaleLayouts],
  ['en-US', enUS.editor.layouts as LocaleLayouts]
]

function interpolateSampleCopy(message: string) {
  return message
    .replaceAll('{year}', '2026')
    .replaceAll('{month}', 'NOV 2026')
    .replaceAll("{'@'}", '@')
}

describe('pageLayouts', () => {
  it('registers unique layout ids across the declared categories and resolves via getPageLayout', () => {
    const ids = PAGE_LAYOUTS.map((layout) => layout.id)
    expect(new Set(ids).size).toBe(PAGE_LAYOUTS.length)

    for (const layout of PAGE_LAYOUTS) {
      expect(PAGE_LAYOUT_CATEGORIES).toContain(layout.category)
      expect(getPageLayout(layout.id)).toBe(layout)
    }

    expect(getPageLayout('does-not-exist')).toBeUndefined()
  })

  it.each(LOCALES)('resolves every category, layout name and referenced copy key in %s', (localeName, localeLayouts) => {
    for (const category of PAGE_LAYOUT_CATEGORIES) {
      const label = localeLayouts.categories[category]
      expect(label, `${localeName}: missing category label for "${category}"`).toBeTypeOf('string')
      expect(label!.trim().length, `${localeName}: empty category label for "${category}"`).toBeGreaterThan(0)
    }

    for (const layout of PAGE_LAYOUTS) {
      const name = localeLayouts.names[layout.id]
      expect(name, `${localeName}: missing layout name for "${layout.id}"`).toBeTypeOf('string')
      expect(name!.trim().length, `${localeName}: empty layout name for "${layout.id}"`).toBeGreaterThan(0)

      const requestedKeys = new Set<string>()
      const layoutCopy = localeLayouts.copy[layout.id]

      layout.build((key) => {
        requestedKeys.add(key)
        const value = layoutCopy?.[key]
        expect(value, `${localeName}: missing copy key "editor.layouts.copy.${layout.id}.${key}"`).toBeTypeOf('string')
        expect(value!.trim().length, `${localeName}: empty copy key "editor.layouts.copy.${layout.id}.${key}"`).toBeGreaterThan(0)
        return interpolateSampleCopy(value!)
      })

      if (requestedKeys.size > 0) {
        expect(Object.keys(layoutCopy ?? {}).sort()).toEqual([...requestedKeys].sort())
      } else {
        expect(layoutCopy).toBeUndefined()
      }
    }
  })

  it.each(LOCALES)('builds valid elements within the 5 mm safe margin for every layout in %s', (localeName, localeLayouts) => {
    const epsilon = 1e-6

    for (const layout of PAGE_LAYOUTS) {
      const drafts = layout.build((key) => interpolateSampleCopy(localeLayouts.copy[layout.id]?.[key] ?? ''))
      expect(drafts.length, `${localeName}/${layout.id}: expected at least one element`).toBeGreaterThan(0)

      for (const [index, draft] of drafts.entries()) {
        const label = `${localeName}/${layout.id}[${index}] (${draft.type})`

        expect(Number.isFinite(draft.x), label).toBe(true)
        expect(Number.isFinite(draft.y), label).toBe(true)
        expect(Number.isFinite(draft.width), label).toBe(true)
        expect(Number.isFinite(draft.height), label).toBe(true)
        expect(Number.isFinite(draft.rotation), label).toBe(true)
        expect(draft.opacity, label).toBeGreaterThan(0)
        expect(draft.opacity, label).toBeLessThanOrEqual(1)
        expect(draft.width, label).toBeGreaterThan(0)

        if (draft.type === 'line') {
          expect(draft.height, label).toBe(0)
          expect(draft.strokeWidth, label).toBeGreaterThan(0)
          expect(hasPaint(draft.stroke), label).toBe(true)
        } else {
          expect(draft.height, label).toBeGreaterThan(0)
        }

        if (draft.type === 'text') {
          expect(draft.text.trim().length, label).toBeGreaterThan(0)
          expect(draft.fontSize, label).toBeGreaterThan(0)
          expect(draft.lineHeight, label).toBeGreaterThan(0)
          expect(FONT_OPTIONS, label).toContain(draft.fontFamily)
          expect(hasPaint(draft.fill), label).toBe(true)
        }

        if (draft.type === 'rect' || draft.type === 'circle') {
          expect(draft.strokeWidth, label).toBeGreaterThan(0)
          expect(hasPaint(draft.fill) || hasPaint(draft.stroke), label).toBe(true)
        }

        if (draft.type === 'pattern') {
          expect(draft.spacing, label).toBeGreaterThanOrEqual(MIN_PATTERN_SPACING)
          expect(draft.strokeWidth, label).toBeGreaterThan(0)
          expect(hasPaint(draft.stroke), label).toBe(true)
        }

        const bounds = getRotatedBounds(draft)
        expect(bounds.left, `${label}: left ${unitsToMm(bounds.left).toFixed(2)} mm < 5 mm`).toBeGreaterThanOrEqual(SAFE_MARGIN - epsilon)
        expect(bounds.right, `${label}: right ${unitsToMm(bounds.right).toFixed(2)} mm > safe width`).toBeLessThanOrEqual(PAGE_W - SAFE_MARGIN + epsilon)
        expect(bounds.top, `${label}: top ${unitsToMm(bounds.top).toFixed(2)} mm < 5 mm`).toBeGreaterThanOrEqual(SAFE_MARGIN - epsilon)
        expect(bounds.bottom, `${label}: bottom ${unitsToMm(bounds.bottom).toFixed(2)} mm > safe height`).toBeLessThanOrEqual(PAGE_H - SAFE_MARGIN + epsilon)
      }
    }
  })
})
