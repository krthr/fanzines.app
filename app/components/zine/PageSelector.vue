<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_IDS, PAGE_LABELS, PAGE_SHORT_LABELS, type PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'

const props = defineProps<{
  compact?: boolean
}>()

const { state, selectPage } = useZineStore()

const pages = computed(() => PAGE_IDS.map((id) => ({
  id,
  label: PAGE_LABELS[id],
  short: PAGE_SHORT_LABELS[id],
  count: state.value.pageElementIds[id].length
})))

function choosePage(pageId: PageId) {
  selectPage(pageId)
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
      class="min-w-0 border px-3 py-2 text-left transition"
      :class="[
        props.compact ? 'w-24 shrink-0 rounded-md' : 'rounded-lg',
        state.selectedPageId === page.id
          ? 'border-[var(--zine-accent)] bg-[rgb(15_143_140_/_10%)] text-default shadow-sm'
          : 'border-muted bg-default/70 text-muted hover:border-[var(--zine-accent)] hover:text-default'
      ]"
      :aria-pressed="state.selectedPageId === page.id"
      @click="choosePage(page.id)"
    >
      <span class="block truncate text-sm font-semibold leading-5">
        {{ props.compact ? page.short : page.label }}
      </span>
      <span class="mt-0.5 block text-[11px] leading-4 opacity-70">
        {{ page.count === 1 ? '1 elemento' : `${page.count} elementos` }}
      </span>
    </button>
  </div>
</template>
