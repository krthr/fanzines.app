<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PatternElement, TextElement, ZineElementDraft } from '~/types/zine'
import { PAGE_H, PAGE_W } from '~/utils/zineLayout'
import { getLineDash, getPatternGeometry, hasPaint } from '~/utils/zineShapes'

// The miniature of a page layout on its card: an SVG of the very elements the layout
// adds, in page units, so it stays sharp at any size and matches what lands on the page.
defineProps<{ elements: ZineElementDraft[] }>()

// At card size a 0.3 mm rule is a third of a pixel; strokes are drawn no thinner than
// about 0.8 mm so the miniature still shows where they are.
const MIN_PREVIEW_STROKE = 11

function stroke(width: number) {
  return Math.max(width, MIN_PREVIEW_STROKE)
}

function paint(value: string) {
  return hasPaint(value) ? value : 'none'
}

function placement(element: ZineElementDraft) {
  return `translate(${element.x} ${element.y}) rotate(${element.rotation})`
}

// Lines and dots as one path: a dot is a zero-length segment with a round cap.
function patternPath(element: Omit<PatternElement, 'id' | 'pageId'>) {
  const geometry = getPatternGeometry(element)
  return [
    ...geometry.lines.map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`),
    ...geometry.dots.map(([x, y]) => `M${x} ${y}h0`)
  ].join('')
}

function textStyle(element: Omit<TextElement, 'id' | 'pageId'>): CSSProperties {
  return {
    color: element.fill,
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize}px`,
    fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: element.fontStyle === 'bold' ? 700 : 400,
    lineHeight: String(element.lineHeight),
    textAlign: element.align
  }
}
</script>

<template>
  <svg class="layout-preview" :viewBox="`0 0 ${PAGE_W} ${PAGE_H}`" aria-hidden="true">
    <rect :width="PAGE_W" :height="PAGE_H" fill="#fff" />
    <g
      v-for="(element, index) in elements"
      :key="index"
      :transform="placement(element)"
      :opacity="element.opacity"
    >
      <rect
        v-if="element.type === 'rect'"
        :width="element.width"
        :height="element.height"
        :fill="paint(element.fill)"
        :stroke="paint(element.stroke)"
        :stroke-width="stroke(element.strokeWidth)"
      />
      <ellipse
        v-else-if="element.type === 'circle'"
        :cx="element.width / 2"
        :cy="element.height / 2"
        :rx="element.width / 2"
        :ry="element.height / 2"
        :fill="paint(element.fill)"
        :stroke="paint(element.stroke)"
        :stroke-width="stroke(element.strokeWidth)"
      />
      <line
        v-else-if="element.type === 'line'"
        :x2="element.width"
        :stroke="element.stroke"
        :stroke-width="stroke(element.strokeWidth)"
        :stroke-dasharray="getLineDash(element)?.join(' ')"
        :stroke-linecap="element.dash === 'dotted' ? 'round' : 'butt'"
      />
      <path
        v-else-if="element.type === 'pattern'"
        :d="patternPath(element)"
        fill="none"
        :stroke="element.stroke"
        :stroke-width="stroke(element.strokeWidth)"
        :stroke-linecap="element.pattern === 'dot-grid' ? 'round' : 'butt'"
      />
      <foreignObject
        v-else-if="element.type === 'text'"
        class="text-box"
        :width="element.width"
        :height="element.height"
      >
        <p class="text" :style="textStyle(element)" v-text="element.text" />
      </foreignObject>
    </g>
  </svg>
</template>

<style scoped>
.layout-preview {
  display: block;
  width: 100%;
  height: auto;
}

.text-box {
  overflow: visible;
}

.text {
  margin: 0;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}
</style>
