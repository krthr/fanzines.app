<script setup lang="ts">
import { PAGE_LABELS, PAGE_SHORT_LABELS, type PageId } from '~/types/zine'
import { READING_SPREADS } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineEditorView } from '~/composables/useZineEditorView.client'
import { useTrackedZinePageSelection } from '~/composables/useTrackedZinePageSelection.client'
import { usePageTileDrop } from '~/composables/usePageTileDrop.client'
import PageMini from '~/components/zine/PageMini.vue'

// The mobile page navigator: the same reading spreads as the sidebar, in one row.
const MINI_WIDTH = 34

const { state } = useZineStore()
const { mode, dropTargetPageIds } = useZineEditorView()
const { selectTrackedPage } = useTrackedZinePageSelection()
const { onTileDragOver, onTileDragLeave, onTileDrop } = usePageTileDrop()

const groups = READING_SPREADS.map((spread) => {
  const pageIds = spread.filter((pageId): pageId is PageId => pageId !== null)

  return {
    pageIds,
    label: pageIds.map((pageId) => PAGE_SHORT_LABELS[pageId]).join(' · ')
  }
})

function isActive(pageId: PageId) {
  return mode.value === 'design' && state.value.selectedPageId === pageId
}

function choosePage(pageId: PageId) {
  if (mode.value === 'review') {
    mode.value = 'design'
    selectTrackedPage(pageId, { compact: true, input_method: 'review_thumbnail' })
    return
  }

  selectTrackedPage(pageId, { compact: true, input_method: 'page_selector_compact' })
}
</script>

<template>
  <nav class="strip" aria-label="Páginas del fanzine">
    <div
      v-for="group in groups"
      :key="group.label"
      class="group"
      :class="{ 'is-active': group.pageIds.some(isActive) }"
    >
      <div class="pages">
        <button
          v-for="pageId in group.pageIds"
          :key="pageId"
          type="button"
          class="page"
          :aria-label="PAGE_LABELS[pageId]"
          :aria-current="isActive(pageId) ? 'page' : undefined"
          @click="choosePage(pageId)"
          @dragover="onTileDragOver($event, pageId)"
          @dragleave="onTileDragLeave($event, pageId)"
          @drop="onTileDrop($event, pageId)"
        >
          <PageMini
            :page-id="pageId"
            :width="MINI_WIDTH"
            :active="isActive(pageId)"
            :drop-target="dropTargetPageIds.includes(pageId)"
          />
        </button>
      </div>
      <span class="label" aria-hidden="true">{{ group.label }}</span>
    </div>
  </nav>
</template>

<style scoped>
.strip {
  --mini-empty-opacity: 0.3;
  display: flex;
  flex: none;
  align-items: flex-end;
  gap: 12px;
  padding: 9px 12px calc(14px + env(safe-area-inset-bottom, 0px));
  overflow-x: auto;
  border-top: 1px solid var(--line);
  background: var(--bg);
  scrollbar-width: none;
}

/* Centred when it fits; on the narrowest phones it scrolls from the first page. */
.group:first-child {
  margin-left: auto;
}

.group:last-child {
  margin-right: auto;
}

.group {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;
}

.group.is-active {
  color: var(--ink);
  font-weight: 700;
}

.pages {
  display: flex;
  gap: 1px;
}

.page {
  width: 34px;
  height: 48px;
  padding: 0;
  border: 0;
  background: transparent;
}

.label {
  white-space: nowrap;
}
</style>
