<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { PageId } from '~/types/zine'
import { PAGE_LABELS } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useTrackedZinePageSelection } from '~/composables/useTrackedZinePageSelection.client'
import { renderSheetBlob } from '~/utils/renderSheet.client'
import { IMPOSED_PAGE_IDS, IMPOSITION_SLOTS } from '~/utils/zineLayout'

// The imposed A4 sheet. Small in the sidebar ("Pliego"), large in review, where
// its guides follow what the PDF will carry.
const props = defineProps<{ review?: boolean }>()
const emit = defineEmits<{ select: [pageId: PageId] }>()

const PREVIEW_RENDER_DELAY_MS = 140

const { state } = useZineStore()
const { selectTrackedPage } = useTrackedZinePageSelection()
const previewImageUrl = ref('')
const renderFailed = ref(false)

let isMounted = false
let renderVersion = 0
let renderTimeoutId: number | null = null

const slots = computed(() => IMPOSED_PAGE_IDS.map((pageId) => ({
  pageId,
  slot: IMPOSITION_SLOTS[pageId]
})))

const showGuides = computed(() => props.review ? state.value.exportGuides : state.value.previewGuides)

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

function choosePage(pageId: PageId) {
  selectTrackedPage(pageId, { input_method: props.review ? 'review_sheet' : 'sheet_preview' })
  emit('select', pageId)
}

async function renderPreview() {
  const version = ++renderVersion

  try {
    const blob = await renderSheetBlob(state.value, props.review
      ? { pxPerMm: 2.75, pixelRatio: Math.min(window.devicePixelRatio || 1, 2) }
      : { pxPerMm: 2, pixelRatio: 1 })

    if (!blob) throw new Error('No se pudo generar la previsualización.')

    const imageUrl = URL.createObjectURL(blob)

    if (version !== renderVersion) {
      URL.revokeObjectURL(imageUrl)
      return
    }

    if (previewImageUrl.value) {
      URL.revokeObjectURL(previewImageUrl.value)
    }

    previewImageUrl.value = imageUrl
    renderFailed.value = false
  } catch {
    if (version !== renderVersion) return

    if (previewImageUrl.value) {
      URL.revokeObjectURL(previewImageUrl.value)
    }

    previewImageUrl.value = ''
    renderFailed.value = true
  }
}

function schedulePreviewRender() {
  if (!isMounted || !import.meta.client) return

  if (renderTimeoutId !== null) {
    window.clearTimeout(renderTimeoutId)
  }

  renderTimeoutId = window.setTimeout(() => {
    renderTimeoutId = null
    void renderPreview()
  }, PREVIEW_RENDER_DELAY_MS)
}

onMounted(() => {
  isMounted = true
  schedulePreviewRender()
})

onBeforeUnmount(() => {
  isMounted = false
  renderVersion++

  if (renderTimeoutId !== null) {
    window.clearTimeout(renderTimeoutId)
  }

  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value)
  }
})

watch(renderKey, schedulePreviewRender, { flush: 'post' })
</script>

<template>
  <div class="sheet" :class="{ 'is-review': review }">
    <img
      v-if="previewImageUrl && !renderFailed"
      :src="previewImageUrl"
      alt="Previsualización del pliego A4 del fanzine"
      class="sheet-image"
      draggable="false"
    >

    <button
      v-for="item in slots"
      :key="item.pageId"
      type="button"
      class="slot"
      :class="{ 'is-active': !review && state.selectedPageId === item.pageId }"
      :style="slotStyle(item.pageId)"
      :title="review ? `Editar ${PAGE_LABELS[item.pageId].toLowerCase()}` : undefined"
      @click="choosePage(item.pageId)"
    >
      <span
        v-if="!review"
        class="slot-label"
        :class="{ 'is-shown': showGuides || state.selectedPageId === item.pageId }"
      >
        {{ item.slot.label === 'Portada' || item.slot.label === 'Contraportada' ? item.slot.label : `p. ${item.slot.label}` }}
      </span>
      <span class="sr-only">{{ PAGE_LABELS[item.pageId] }}</span>
    </button>

    <template v-if="showGuides">
      <span class="guide fold-v" style="left: 25%;" />
      <span class="guide fold-v" style="left: 50%;" />
      <span class="guide fold-v" style="left: 75%;" />
      <span class="guide fold-h" style="left: 0; width: 25%;" />
      <span class="guide fold-h" style="right: 0; width: 25%;" />
      <span class="guide cut" />
      <span v-if="review" class="cut-label">
        <UIcon name="i-lucide-scissors" aria-hidden="true" />
        corte
      </span>
    </template>
  </div>
</template>

<style scoped>
.sheet {
  --cut: #e5372b;
  position: relative;
  width: 100%;
  aspect-ratio: 297 / 210;
  background: #fff;
  box-shadow: 4px 4px 0 var(--orange-deep);
}

.sheet.is-review {
  box-shadow: 10px 10px 0 var(--orange-deep);
}

.sheet-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
}

.slot {
  position: absolute;
  z-index: 1;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  text-align: left;
}

.slot:hover,
.slot:focus-visible {
  box-shadow: inset 0 0 0 2px var(--orange);
}

.slot:focus-visible {
  outline: 0;
}

.slot.is-active {
  box-shadow: inset 0 0 0 2px var(--acid), inset 0 0 0 3px var(--ink-dark);
}

.slot-label {
  position: absolute;
  top: 3px;
  left: 3px;
  max-width: calc(100% - 6px);
  padding: 1px 3px;
  overflow: hidden;
  background: var(--acid);
  color: var(--ink-dark);
  font-family: var(--font-type);
  font-size: 9px;
  line-height: 11px;
  opacity: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-label.is-shown,
.slot:hover .slot-label,
.slot:focus-visible .slot-label {
  opacity: 1;
}

.guide {
  position: absolute;
  z-index: 2;
  pointer-events: none;
}

.guide.fold-v {
  top: 0;
  bottom: 0;
  border-left: 1px solid rgb(0 0 0 / 15%);
}

.guide.fold-h {
  top: 50%;
  border-top: 1px solid rgb(0 0 0 / 15%);
}

.guide.cut {
  top: 50%;
  right: 25%;
  left: 25%;
  height: 2px;
  background: var(--cut);
  transform: translateY(-1px);
}

.cut-label {
  position: absolute;
  top: calc(50% - 13px);
  left: 44.75%;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--cut);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
  pointer-events: none;
}

.cut-label .iconify {
  width: 12px;
  height: 12px;
}
</style>
