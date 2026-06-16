<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_IDS, PAGE_LABELS, PAGE_SHORT_LABELS, type PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'

const props = defineProps<{
  compact?: boolean
}>()

const { state, elementCount, selectPage } = useZineStore()
const { trackZineEvent } = useZineAnalytics()

const pages = computed(() => PAGE_IDS.map((id) => ({
  id,
  label: PAGE_LABELS[id],
  short: PAGE_SHORT_LABELS[id],
  count: state.value.pageElementIds[id].length
})))

function choosePage(pageId: PageId) {
  if (pageId === state.value.selectedPageId) return

  const previousPageId = state.value.selectedPageId

  selectPage(pageId)
  trackZineEvent('zine_page_selected', {
    page_id: pageId,
    from_page_id: previousPageId,
    page_element_count: state.value.pageElementIds[pageId].length,
    compact: props.compact === true,
    element_count: elementCount.value
  })
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
        state.selectedPageId === page.id
          ? 'zine-page-tile-active'
          : 'zine-page-tile-idle'
      ]"
      :aria-pressed="state.selectedPageId === page.id"
      @click="choosePage(page.id)"
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
