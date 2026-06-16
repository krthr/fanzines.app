<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_IDS, type PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useTrackedZinePageSelection } from '~/composables/useTrackedZinePageSelection.client'
import { useZinePageLabels } from '~/composables/useZinePageLabels'

const props = defineProps<{
  compact?: boolean
}>()

const { state } = useZineStore()
const { selectTrackedPage } = useTrackedZinePageSelection()
const { t } = useI18n()
const { pageLabel, pageShortLabel } = useZinePageLabels()

const pages = computed(() => PAGE_IDS.map((id) => ({
  id,
  label: pageLabel(id),
  short: pageShortLabel(id),
  count: state.value.pageElementIds[id].length
})))

function elementCountLabel(count: number) {
  return count === 1
    ? t('pageSelector.elementCountSingle')
    : t('pageSelector.elementCountMultiple', { count })
}

function choosePage(pageId: PageId) {
  selectTrackedPage(pageId, {
    compact: props.compact === true,
    input_method: props.compact === true ? 'page_selector_compact' : 'page_selector'
  })
}
</script>

<template>
  <div
    class="zine-scrollbar"
    :class="props.compact ? 'flex gap-2 overflow-x-auto pb-1' : 'grid grid-cols-2 gap-2'"
    :aria-label="t('pageSelector.ariaLabel')"
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
        {{ elementCountLabel(page.count) }}
      </span>
    </button>
  </div>
</template>
