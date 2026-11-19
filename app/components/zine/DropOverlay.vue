<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_IDS, getPageNumber, type PageId } from '~/types/zine'
import { useZineDragState } from '~/composables/useZineDragState.client'
import { useZineEditorView } from '~/composables/useZineEditorView.client'
import { useZinePageLabels } from '~/composables/useZinePageLabels'

// Shown over the canvas while files are dragged across the editor. It only
// states the rule the import already follows: one image per page, from the
// start page onward, in reading order.
const { t, localeProperties } = useI18n()
const { dragFileCount } = useZineDragState()
const { dropStartPageId, dropTargetPageIds } = useZineEditorView()
const { pageName, pagePlace } = useZinePageLabels()

// null when the browser does not say how many files are being dragged;
// 0 when it does and none of them is an image.
const count = computed(() => dragFileCount.value)
const hasNoImages = computed(() => count.value === 0)
const targets = computed(() => dropTargetPageIds.value)
const available = computed(() => PAGE_IDS.length - PAGE_IDS.indexOf(dropStartPageId.value))

// "portada, 1, 2 y 3" / "front cover, 1, 2, and 3".
const listFormat = computed(() => new Intl.ListFormat(localeProperties.value.language, { type: 'conjunction' }))

// In the reading order the inner pages go by their number alone.
function readingName(pageId: PageId) {
  const number = getPageNumber(pageId)
  return number === null ? pageName(pageId) : String(number)
}

const title = computed(() => {
  if (hasNoImages.value) return t('editor.drop.onlyImages')
  if (count.value === null) return t('editor.drop.titleUnknown')
  return t('editor.drop.title', count.value)
})

const rule = computed(() => {
  const start = pagePlace(dropStartPageId.value)

  if (count.value === null) return t('editor.drop.ruleUnknown', { start })
  if (count.value === 1) return t('editor.drop.ruleOne', { start })

  const order = listFormat.value.format(targets.value.map(readingName))

  if (count.value > available.value) {
    return t('editor.drop.ruleOverflow', { start, order, fit: t('editor.drop.fit', available.value) })
  }

  return t('editor.drop.ruleMany', { start, order })
})

// One photo goes on a page; several start from it.
const hint = computed(() => t('editor.drop.hint', count.value === 1 ? 1 : 2))

const diagramCount = computed(() => count.value === null ? 3 : Math.max(1, targets.value.length))
</script>

<template>
  <div class="drop" aria-hidden="true">
    <p class="drop-title">
      {{ title }}
    </p>

    <div v-if="!hasNoImages" class="drop-card">
      <div class="drop-diagram">
        <span v-for="index in diagramCount" :key="index" class="drop-mini" />
      </div>
      <p class="drop-rule-title">
        {{ t('editor.drop.ruleTitle') }}
      </p>
      <p class="drop-rule">
        {{ rule }}
      </p>
    </div>

    <p v-if="!hasNoImages" class="drop-hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.drop {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: rgb(11 10 9 / 96%);
  pointer-events: none;
}

.drop-title {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 30px;
  letter-spacing: 1px;
  line-height: 45px;
  text-align: center;
  text-transform: uppercase;
}

.drop-card {
  display: flex;
  width: min(420px, 100%);
  min-height: 270px;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 28px;
  background: var(--acid);
  box-shadow: 8px 8px 0 var(--orange);
  color: var(--ink-dark);
}

.drop-diagram {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.drop-mini {
  flex: 0 1 44px;
  aspect-ratio: 44 / 62;
  background: var(--ink-dark);
  box-shadow: inset 0 0 0 1.5px var(--ink-dark), inset 0 0 0 4px #fff;
}

.drop-rule-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  letter-spacing: 0.5px;
  line-height: 1;
  text-transform: uppercase;
}

.drop-rule {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
}

.drop-hint {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 16px;
  text-align: center;
}
</style>
