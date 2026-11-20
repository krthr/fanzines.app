<script setup lang="ts">
import type { PageId } from '~/types/zine'
import { READING_SPREADS } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineEditorView } from '~/composables/useZineEditorView.client'
import { useTrackedZinePageSelection } from '~/composables/useTrackedZinePageSelection.client'
import { usePageTileDrop } from '~/composables/usePageTileDrop.client'
import { useLayoutDragState } from '~/composables/usePageLayouts.client'
import { useZinePageLabels } from '~/composables/useZinePageLabels'
import PageMini from '~/components/zine/PageMini.vue'
import SheetPreview from '~/components/zine/SheetPreview.vue'

const THUMB_WIDTH = 74

const emit = defineEmits<{ reset: [] }>()

const { t } = useI18n()
const { state } = useZineStore()
const { pageLabel, pageShortLabel } = useZinePageLabels()
const { mode, sidebarView, dropTargetPageIds } = useZineEditorView()
const { selectTrackedPage } = useTrackedZinePageSelection()
const { onTileDragOver, onTileDragLeave, onTileDrop } = usePageTileDrop()
const { layoutDropPageId } = useLayoutDragState()

// In review nothing is being edited, so no page is marked as current.
function isActive(pageId: PageId | null) {
  return pageId !== null && mode.value === 'design' && state.value.selectedPageId === pageId
}

// Where dragged photos would go, or the page under a dragged layout.
function isDropTarget(pageId: PageId) {
  return dropTargetPageIds.value.includes(pageId) || layoutDropPageId.value === pageId
}

function choosePage(pageId: PageId) {
  if (mode.value === 'review') {
    mode.value = 'design'
    selectTrackedPage(pageId, { input_method: 'review_thumbnail' })
    return
  }

  selectTrackedPage(pageId, { compact: false, input_method: 'page_selector' })
}

// The sheet selects the page itself; in review, a selected page is opened for editing.
function leaveReview() {
  if (mode.value === 'review') mode.value = 'design'
}
</script>

<template>
  <aside class="sidebar ed-scroll" :aria-label="t('editor.sidebar.label')">
    <div class="head">
      <h2 class="ed-display">
        {{ t('editor.sidebar.title') }}
      </h2>
      <button
        type="button"
        class="reset"
        :aria-label="t('editor.sidebar.reset')"
        :title="t('editor.sidebar.reset')"
        @click="emit('reset')"
      >
        <UIcon name="i-lucide-refresh-cw" aria-hidden="true" />
      </button>
    </div>

    <div class="ed-segment" role="group" :aria-label="t('editor.sidebar.orderLabel')">
      <button
        type="button"
        class="ed-segment-item"
        :class="{ 'is-active': sidebarView === 'reading' }"
        :aria-pressed="sidebarView === 'reading'"
        @click="sidebarView = 'reading'"
      >
        {{ t('editor.sidebar.reading') }}
      </button>
      <button
        type="button"
        class="ed-segment-item"
        :class="{ 'is-active': sidebarView === 'sheet' }"
        :aria-pressed="sidebarView === 'sheet'"
        @click="sidebarView = 'sheet'"
      >
        {{ t('editor.sidebar.sheet') }}
      </button>
    </div>

    <div v-if="sidebarView === 'reading'" class="spreads">
      <div
        v-for="(spread, index) in READING_SPREADS"
        :key="index"
        class="spread"
        :class="{ 'is-active': spread.some(isActive) }"
      >
        <template v-for="(pageId, side) in spread" :key="side">
          <button
            v-if="pageId"
            type="button"
            class="thumb"
            :class="{
              'is-active': isActive(pageId),
              'is-target': isDropTarget(pageId)
            }"
            :aria-label="pageLabel(pageId)"
            :aria-current="isActive(pageId) ? 'page' : undefined"
            @click="choosePage(pageId)"
            @dragover="onTileDragOver($event, pageId)"
            @dragleave="onTileDragLeave($event, pageId)"
            @drop="onTileDrop($event, pageId)"
          >
            <span class="thumb-page">
              <PageMini
                :page-id="pageId"
                :width="THUMB_WIDTH"
                :active="isActive(pageId)"
                :drop-target="isDropTarget(pageId)"
                captions
              />
            </span>
            <span class="thumb-label">{{ pageShortLabel(pageId) }}</span>
          </button>
          <span v-else class="no-page" aria-hidden="true" />
        </template>
      </div>
    </div>

    <div v-else class="sheet">
      <SheetPreview @select="leaveReview" />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 20px 19px 20px 20px;
  overflow-y: auto;
  border-right: 1px solid var(--line);
}

.head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  color: var(--ink);
}

.reset {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--muted);
  transition: color 180ms ease;
}

.reset:hover {
  color: var(--ink);
}

.reset .iconify {
  width: 16px;
  height: 16px;
}

.ed-segment {
  flex: none;
}

.spreads {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spread {
  display: flex;
  justify-content: center;
  gap: 1px;
  padding: 4px 6px;
}

.spread.is-active {
  background: var(--ed-raised);
}

.thumb {
  display: flex;
  width: 74px;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
}

.thumb-page {
  display: block;
  width: 74px;
  height: 105px;
}

.thumb:hover .thumb-label {
  color: var(--ink);
}

.thumb.is-active .thumb-label {
  color: var(--ink);
  font-weight: 700;
}

.thumb.is-target .thumb-label {
  color: var(--acid);
  font-weight: 700;
}

.no-page {
  width: 74px;
  height: 105px;
}

.sheet {
  /* Room for the sheet's offset shadow. */
  padding: 0 4px 4px 0;
}
</style>
