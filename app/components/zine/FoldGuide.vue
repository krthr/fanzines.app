<script setup lang="ts">
import { computed } from 'vue'
import { getPageNumber } from '~/types/zine'
import { useLocalizedImage } from '~/composables/useLocalizedImage'
import { useZinePageLabels } from '~/composables/useZinePageLabels'
import { IMPOSED_PAGE_IDS, IMPOSITION_SLOTS } from '~/utils/zineLayout'

// The hand-drawn folding guide. Its template step is drawn empty, and the page labels
// are written onto it here from IMPOSITION_SLOTS, so the guide always shows the sheet
// the PDF prints, top row upside down included.

const { t } = useI18n()
const localizedImage = useLocalizedImage()
const { pageShortLabel } = useZinePageLabels()

// The centre of each column and row of the template, in the drawing's 1448 × 1086 pixels.
const COLUMN_CENTERS = [117, 226, 333, 439]
const ROW_CENTERS = [429, 542]

// Written by hand, no two labels sit quite straight: a small fixed tilt per cell, rows × columns.
const TILTS = [[-2, 1.5, -1, 2], [2, -1.5, 1, -2]]

const labels = computed(() => IMPOSED_PAGE_IDS.map((pageId) => {
  const slot = IMPOSITION_SLOTS[pageId]
  const text = pageShortLabel(pageId)
  const isWord = getPageNumber(pageId) === null

  return {
    pageId,
    text,
    // Turned about the centre of its cell, so an upside-down label stays in place.
    transform: `translate(${COLUMN_CENTERS[slot.col]} ${ROW_CENTERS[slot.row]}) rotate(${slot.rotation + TILTS[slot.row]![slot.col]!})`,
    // The baseline sits half a cap height below the centre.
    baseline: isWord ? 8 : 15,
    isWord,
    // Upside down, a 6 reads as a 9. Printers underline it to tell them apart.
    isUnderlined: slot.rotation === 180 && text === '6'
  }
}))
</script>

<template>
  <div class="fold-guide">
    <img
      :src="localizedImage('/images/fold-guide.webp')"
      :alt="t('editor.ready.guideAlt')"
      width="1448"
      height="1086"
    >
    <svg viewBox="0 0 1448 1086" aria-hidden="true">
      <g v-for="label in labels" :key="label.pageId" :transform="label.transform">
        <text :y="label.baseline" :class="{ 'is-word': label.isWord }">{{ label.text }}</text>
        <path v-if="label.isUnderlined" d="M -11 27 q 11 2 22 -1" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.fold-guide {
  position: relative;
}

.fold-guide img {
  display: block;
  width: 100%;
  height: auto;
}

.fold-guide svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

text {
  /* The lettering of the English drawing; the Spanish one is close to it. The stroke
     gives it the weight of the pen the rest of the drawing uses. */
  fill: #161616;
  stroke: #161616;
  stroke-linejoin: round;
  stroke-width: 1.2px;
  font-family: "Coming Soon", "Comic Sans MS", cursive;
  font-size: 44px;
  text-anchor: middle;
}

text.is-word {
  stroke-width: 0.8px;
  font-size: 23px;
}

path {
  fill: none;
  stroke: #161616;
  stroke-linecap: round;
  stroke-width: 3px;
}
</style>
