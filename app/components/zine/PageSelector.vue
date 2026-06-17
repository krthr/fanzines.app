<script setup lang="ts">
import { computed, ref } from 'vue'
import { PAGE_IDS, PAGE_LABELS, PAGE_SHORT_LABELS, type PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useTrackedZinePageSelection } from '~/composables/useTrackedZinePageSelection.client'
import { useZineImageImport } from '~/composables/useZineImageImport.client'
import { useZineDragState } from '~/composables/useZineDragState.client'

const props = defineProps<{
  compact?: boolean
}>()

const { state } = useZineStore()
const { selectTrackedPage } = useTrackedZinePageSelection()
const { processImageFiles } = useZineImageImport()
const { resetDrag } = useZineDragState()

const pages = computed(() => PAGE_IDS.map((id) => ({
  id,
  label: PAGE_LABELS[id],
  short: PAGE_SHORT_LABELS[id],
  count: state.value.pageElementIds[id].length
})))

const dropoverPageId = ref<PageId | null>(null)

function choosePage(pageId: PageId) {
  selectTrackedPage(pageId, {
    compact: props.compact === true,
    input_method: props.compact === true ? 'page_selector_compact' : 'page_selector'
  })
}

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes('Files'))
}

function handleTileDragOver(event: DragEvent, pageId: PageId) {
  if (!isFileDrag(event)) return
  event.preventDefault()
  dropoverPageId.value = pageId
}

function handleTileDragLeave(event: DragEvent) {
  if (!isFileDrag(event)) return
  dropoverPageId.value = null
}

function handleTileDrop(event: DragEvent, pageId: PageId) {
  if (!isFileDrag(event)) return
  event.preventDefault()
  event.stopPropagation()
  dropoverPageId.value = null
  resetDrag()
  const files = Array.from(event.dataTransfer?.files ?? [])
  void processImageFiles(files, { inputMethod: 'drag_drop', dropTarget: 'page_tile', startPageId: pageId })
}
</script>

<template>
  <div
    class="zine-scrollbar"
    :class="props.compact ? 'flex gap-2 overflow-x-auto pb-1' : 'grid grid-cols-2 gap-2'"
    aria-label="Paneles del fanzine"
  >
    <button
      v-for="page in pages"
      :key="page.id"
      type="button"
      class="zine-page-tile min-w-0 px-3 py-2 text-left transition"
      :class="[
        props.compact ? 'w-24 shrink-0' : '',
        dropoverPageId === page.id ? 'zine-page-tile-dropover' : state.selectedPageId === page.id
          ? 'zine-page-tile-active'
          : 'zine-page-tile-idle'
      ]"
      :aria-pressed="state.selectedPageId === page.id"
      @click="choosePage(page.id)"
      @dragover="handleTileDragOver($event, page.id)"
      @dragleave="handleTileDragLeave"
      @drop="handleTileDrop($event, page.id)"
    >
      <span class="block truncate text-sm font-black uppercase leading-5">
        {{ props.compact ? page.short : page.label }}
      </span>
      <span class="mt-0.5 block text-[11px] leading-4 opacity-70">
        {{ page.count === 1 ? '1 elemento' : `${page.count} elementos` }}
      </span>
    </button>
  </div>
</template>
