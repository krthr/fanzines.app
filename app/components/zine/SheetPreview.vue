<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { PageId } from '~/types/zine'
import { PAGE_LABELS } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { renderSheetDataUrl } from '~/utils/renderSheet.client'
import { IMPOSED_PAGE_IDS, IMPOSITION_SLOTS } from '~/utils/zineLayout'

const PREVIEW_PX_PER_MM = 2

const { state, selectPage } = useZineStore()
const previewImageUrl = ref('')
const renderFailed = ref(false)

let isMounted = false
let renderVersion = 0
let animationFrameId: number | null = null

const slots = computed(() => IMPOSED_PAGE_IDS.map((pageId) => ({
  pageId,
  slot: IMPOSITION_SLOTS[pageId]
})))

const renderKey = computed(() => JSON.stringify({
  elements: state.value.elements,
  pageElementIds: state.value.pageElementIds
}))

function slotStyle(pageId: PageId): CSSProperties {
  const slot = IMPOSITION_SLOTS[pageId]
  return {
    left: `${slot.col * 25}%`,
    top: `${slot.row * 50}%`,
    width: '25%',
    height: '50%'
  }
}

async function renderPreview() {
  const version = ++renderVersion

  try {
    const imageUrl = await renderSheetDataUrl(state.value, {
      pxPerMm: PREVIEW_PX_PER_MM,
      pixelRatio: 1,
      mimeType: 'image/png'
    })

    if (version !== renderVersion) return

    previewImageUrl.value = imageUrl
    renderFailed.value = false
  } catch {
    if (version !== renderVersion) return

    previewImageUrl.value = ''
    renderFailed.value = true
  }
}

function schedulePreviewRender() {
  if (!isMounted || !import.meta.client) return

  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }

  animationFrameId = window.requestAnimationFrame(() => {
    animationFrameId = null
    void renderPreview()
  })
}

onMounted(() => {
  isMounted = true
  schedulePreviewRender()
})

onBeforeUnmount(() => {
  isMounted = false
  renderVersion++

  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId)
  }
})

watch(renderKey, schedulePreviewRender, { flush: 'post' })
</script>

<template>
  <div class="zine-sheet-preview">
    <img
      v-if="previewImageUrl && !renderFailed"
      :src="previewImageUrl"
      alt="Previsualización del pliego A4 del fanzine"
      class="absolute inset-0 size-full select-none object-fill"
      draggable="false"
    >
    <div v-else class="absolute inset-0 bg-white" />

    <button
      v-for="item in slots"
      :key="item.pageId"
      type="button"
      class="group absolute z-10 overflow-hidden border bg-transparent text-left transition"
      :class="[
        state.previewGuides ? 'border-[rgb(29_28_24_/_18%)]' : 'border-transparent',
        state.selectedPageId === item.pageId
          ? 'ring-2 ring-[var(--zine-accent)] ring-inset'
          : 'hover:ring-1 hover:ring-[var(--zine-accent)] hover:ring-inset'
      ]"
      :style="slotStyle(item.pageId)"
      @click="selectPage(item.pageId)"
    >
      <span
        class="absolute left-1 top-1 z-[22] max-w-[calc(100%-0.5rem)] truncate rounded-[2px] bg-white/80 px-1 text-[9px] font-medium text-muted shadow-sm backdrop-blur-sm transition-opacity"
        :class="state.previewGuides || state.selectedPageId === item.pageId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'"
      >
        {{ item.slot.label === 'Portada' || item.slot.label === 'Contraportada' ? item.slot.label : `p. ${item.slot.label}` }}
      </span>
      <span class="sr-only">{{ PAGE_LABELS[item.pageId] }}</span>
    </button>

    <template v-if="state.previewGuides">
      <span class="zine-sheet-guide fold-v" style="left: 25%;" />
      <span class="zine-sheet-guide fold-v" style="left: 50%;" />
      <span class="zine-sheet-guide fold-v" style="left: 75%;" />
      <span class="zine-sheet-guide fold-h" style="left: 0; top: 50%; width: 25%;" />
      <span class="zine-sheet-guide fold-h" style="right: 0; top: 50%; width: 25%;" />
      <span class="zine-sheet-guide cut-h" />
    </template>
  </div>
</template>
