<script setup lang="ts">
import { computed, useId } from 'vue'
import { PAGE_LAYOUTS, PAGE_LAYOUT_CATEGORIES, type PageLayoutId } from '~/utils/pageLayouts'
import { useZineStore } from '~/composables/useZineStore'
import { usePageLayouts } from '~/composables/usePageLayouts.client'
import { useZinePageLabels } from '~/composables/useZinePageLabels'
import LayoutPreview from '~/components/zine/LayoutPreview.vue'

// The layout catalog, in the inspector while nothing is selected. A click adds a layout
// to the open page; a drag drops it on the canvas or on any page miniature.
const emit = defineEmits<{ applied: [] }>()

const { t } = useI18n()
const { state } = useZineStore()
const { pagePlace } = useZinePageLabels()
const {
  draggedLayoutId,
  lastStamp,
  layoutName,
  buildLayout,
  applyLayout,
  removeStamp,
  startLayoutDrag,
  endLayoutDrag
} = usePageLayouts()

const titleId = useId()
const page = computed(() => pagePlace(state.value.selectedPageId))
// A phone can't drag a card, so the intro only offers it where there is a mouse.
const canDrag = window.matchMedia('(hover: hover) and (pointer: fine)').matches

// Rebuilt when the language changes, so the miniatures show the texts that would be added.
const groups = computed(() => PAGE_LAYOUT_CATEGORIES.map((category) => ({
  category,
  layouts: PAGE_LAYOUTS
    .filter((layout) => layout.category === category)
    .map((layout) => ({
      id: layout.id,
      name: layoutName(layout.id),
      elements: buildLayout(layout.id)
    }))
})))

function add(layoutId: PageLayoutId) {
  applyLayout(layoutId, state.value.selectedPageId, 'click')
  emit('applied')
}

function undoLast() {
  if (lastStamp.value) removeStamp(lastStamp.value, 'inspector')
}
</script>

<template>
  <section class="layouts" :aria-labelledby="titleId">
    <header class="head">
      <h2 :id="titleId" class="ed-display">
        {{ t('editor.layouts.title') }}
      </h2>
      <p class="intro">
        {{ t(canDrag ? 'editor.layouts.intro' : 'editor.layouts.introTouch', { page }) }}
      </p>
    </header>

    <button v-if="lastStamp" type="button" class="ed-btn-line undo" @click="undoLast">
      <UIcon name="i-lucide-undo-2" aria-hidden="true" />
      <span class="undo-label">{{ t('editor.layouts.remove', { layout: layoutName(lastStamp.layoutId) }) }}</span>
    </button>

    <div v-for="group in groups" :key="group.category" class="group">
      <h3 class="group-label">
        {{ t(`editor.layouts.categories.${group.category}`) }}
      </h3>
      <ul class="grid">
        <li v-for="layout in group.layouts" :key="layout.id">
          <button
            type="button"
            class="card"
            :class="{ 'is-dragging': draggedLayoutId === layout.id }"
            draggable="true"
            :aria-label="t('editor.layouts.add', { layout: layout.name, page })"
            :title="layout.name"
            @click="add(layout.id)"
            @dragstart="startLayoutDrag($event, layout.id)"
            @dragend="endLayoutDrag"
          >
            <span class="card-page">
              <LayoutPreview :elements="layout.elements" />
            </span>
            <span class="card-name">{{ layout.name }}</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.layouts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.intro {
  margin: 0;
  color: var(--text-dark);
  font-size: 13px;
  line-height: 16px;
}

.undo {
  width: 100%;
  justify-content: flex-start;
}

.undo-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-label {
  margin: 0;
  color: var(--text-dark);
  font-size: 13px;
  font-weight: 700;
  line-height: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink-dark);
  text-align: left;
  cursor: grab;
}

.card:active {
  cursor: grabbing;
}

/* The miniature is a sheet of paper on the cream panel: a hairline at rest, ink and a
   hard shadow under the pointer. */
.card-page {
  display: block;
  aspect-ratio: 74.25 / 105;
  overflow: hidden;
  border: 1px solid var(--ed-hairline);
  background: #fff;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.card:hover .card-page {
  border-color: var(--ink-dark);
  box-shadow: 3px 3px 0 var(--orange-deep);
}

.card.is-dragging .card-page {
  border-color: var(--ink-dark);
  opacity: 0.5;
}

.card-name {
  font-size: 12px;
  font-weight: 600;
  line-height: 15px;
}
</style>
