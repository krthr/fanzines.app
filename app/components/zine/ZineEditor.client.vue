<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import DropOverlay from '~/components/zine/DropOverlay.vue'
import EditorBrand from '~/components/zine/EditorBrand.vue'
import ElementInspector from '~/components/zine/ElementInspector.vue'
import FlowSteps from '~/components/zine/FlowSteps.vue'
import MobileBar from '~/components/zine/MobileBar.vue'
import PageCanvas from '~/components/zine/PageCanvas.vue'
import PageStrip from '~/components/zine/PageStrip.vue'
import PagesSidebar from '~/components/zine/PagesSidebar.vue'
import PdfReadyDialog from '~/components/zine/PdfReadyDialog.vue'
import ReviewPanel from '~/components/zine/ReviewPanel.vue'
import SheetPreview from '~/components/zine/SheetPreview.vue'
import ZineToggle from '~/components/zine/ZineToggle.vue'
import { PAGE_IDS, PAGE_LABELS } from '~/types/zine'
import { PANEL_SIZE_LABEL } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'
import { useZineImageImport, type ImageInputMethod } from '~/composables/useZineImageImport.client'
import { useZineDragState } from '~/composables/useZineDragState.client'
import { useZineEditorView } from '~/composables/useZineEditorView.client'
import { useZineElementActions } from '~/composables/useZineElementActions.client'
import { useZineExport, type ExportInputMethod } from '~/composables/useZineExport.client'
import { useTrackedZinePageSelection } from '~/composables/useTrackedZinePageSelection.client'

type TextInputMethod = 'top_bar' | 'empty_state_link' | 'mobile_bar'

const {
  state,
  elementCount,
  selectedElement,
  addTextElement,
  selectElement,
  resetZine
} = useZineStore()

const { trackZineEvent } = useZineAnalytics()
const { processImageFiles } = useZineImageImport()
const { isDragActive, markDragEnter, markDragLeave, resetDrag } = useZineDragState()
const { removeSelected } = useZineElementActions()
const { isExporting, exportError, exportPdf } = useZineExport()
const { selectTrackedPage } = useTrackedZinePageSelection()
const {
  mode,
  prefersSpread,
  isPdfReadyOpen,
  isEditingText,
  pageIndex,
  previousPageId,
  nextPageId,
  facingPageId,
  canShowSpread,
  showsSpread,
  filledPageIds,
  resetView
} = useZineEditorView()

const fileInput = ref<HTMLInputElement | null>(null)
const pageCanvasRef = ref<InstanceType<typeof PageCanvas> | null>(null)
const mobileToolsOpen = ref(false)
const isDesktopLayout = ref(import.meta.client ? window.matchMedia('(min-width: 1024px)').matches : false)
const commitKeyLabel = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ Enter' : 'Ctrl Enter'

let pickerInputMethod: ImageInputMethod = 'file_picker'
let desktopMediaQuery: MediaQueryList | null = null
let removeDesktopMediaQueryListener: (() => void) | null = null

const pageTitle = computed(() => PAGE_LABELS[state.value.selectedPageId])

const pageMeta = computed(() => {
  const facing = facingPageId.value
  const pairing = facing
    ? `Junto a la ${PAGE_LABELS[facing].toLowerCase()}`
    : state.value.selectedPageId === 'front-cover'
      ? 'La tapa va sola'
      : 'La contratapa va sola'

  return `${pairing} · ${PANEL_SIZE_LABEL}`
})

// Eight ticks in reading order; a tick fills when its page holds an element.
const pageTicks = computed(() => PAGE_IDS.map((pageId) => filledPageIds.value.includes(pageId)))

// Only shortcuts that exist are listed.
const hints = computed(() => {
  if (isEditingText.value) {
    return [
      { key: 'Esc', label: 'cancelar' },
      { key: commitKeyLabel, label: 'terminar' }
    ]
  }

  if (selectedElement.value) {
    return [
      { key: 'Supr', label: 'eliminar' },
      { key: 'Esc', label: 'deseleccionar' }
    ]
  }

  return []
})

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes('Files'))
}

function openFilePicker(inputMethod: ImageInputMethod = 'file_picker') {
  pickerInputMethod = inputMethod
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (files.length === 0) return

  await processImageFiles(files, { inputMethod: pickerInputMethod })
}

async function handleAddTextElement(inputMethod: TextInputMethod) {
  const pageId = state.value.selectedPageId

  const elementId = addTextElement()
  trackZineEvent('zine_text_element_added', {
    page_id: pageId,
    element_count: elementCount.value,
    input_method: inputMethod
  })

  await nextTick()
  await pageCanvasRef.value?.startTextEditing(elementId, { selectAll: true })
}

function goToPage(pageId: typeof PAGE_IDS[number] | null) {
  if (pageId) selectTrackedPage(pageId, { input_method: 'page_arrows' })
}

function openReview() {
  selectElement(null)
  mobileToolsOpen.value = false
  exportError.value = ''
  mode.value = 'review'
}

function backToDesign() {
  isPdfReadyOpen.value = false
  mode.value = 'design'
}

async function downloadPdf(inputMethod: ExportInputMethod) {
  if (await exportPdf(inputMethod)) {
    isPdfReadyOpen.value = true
  }
}

function handleShellDragEnter(event: DragEvent) {
  if (!isFileDrag(event)) return
  markDragEnter(event)
}

function handleShellDragOver(event: DragEvent) {
  if (!isFileDrag(event)) return
  event.preventDefault()
}

function handleShellDragLeave(event: DragEvent) {
  if (!isFileDrag(event)) return
  markDragLeave()
}

function handleShellDrop(event: DragEvent) {
  if (!isFileDrag(event)) return
  event.preventDefault()
  resetDrag()
  const files = Array.from(event.dataTransfer?.files ?? [])
  void processImageFiles(files, { inputMethod: 'drag_drop', dropTarget: 'shell' })
}

function preventDefaultFileDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('Files')) event.preventDefault()
}

function preventDefaultFileDrop(event: DragEvent) {
  if (event.dataTransfer?.types.includes('Files')) event.preventDefault()
}

function confirmReset() {
  if (window.confirm('¿Reiniciar el fanzine y eliminar todos los elementos?')) {
    const previousElementCount = elementCount.value

    resetZine()
    trackZineEvent('zine_reset_confirmed', {
      previous_element_count: previousElementCount,
      element_count: elementCount.value
    })
  }
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]')

  // The canvas is not on screen in review, so its shortcuts are off too.
  if (isTyping || mode.value !== 'design') return

  if (event.key === 'Escape') {
    selectElement(null)
  }

  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement.value) {
    event.preventDefault()
    removeSelected('keyboard')
  }
}

onMounted(() => {
  resetView()
  desktopMediaQuery = window.matchMedia('(min-width: 1024px)')
  const syncDesktopLayout = () => {
    isDesktopLayout.value = Boolean(desktopMediaQuery?.matches)
    if (isDesktopLayout.value) mobileToolsOpen.value = false
  }

  syncDesktopLayout()
  desktopMediaQuery.addEventListener('change', syncDesktopLayout)
  removeDesktopMediaQueryListener = () => desktopMediaQuery?.removeEventListener('change', syncDesktopLayout)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('dragover', preventDefaultFileDragOver)
  window.addEventListener('drop', preventDefaultFileDrop)
  trackZineEvent('zine_editor_opened', {
    layout: isDesktopLayout.value ? 'desktop' : 'mobile',
    initial_page_id: state.value.selectedPageId,
    page_count: Object.keys(state.value.pageElementIds).length,
    element_count: elementCount.value
  })
})

onBeforeUnmount(() => {
  removeDesktopMediaQueryListener?.()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('dragover', preventDefaultFileDragOver)
  window.removeEventListener('drop', preventDefaultFileDrop)
  resetDrag()
})
</script>

<template>
  <div
    class="ed-shell"
    :class="[isDesktopLayout ? 'is-desktop' : 'is-mobile', `is-${mode}`]"
    @dragenter="handleShellDragEnter"
    @dragover="handleShellDragOver"
    @dragleave="handleShellDragLeave"
    @drop="handleShellDrop"
  >
    <input
      ref="fileInput"
      class="hidden"
      type="file"
      accept="image/*"
      multiple
      @change="handleFileChange"
    >

    <header class="ed-topbar">
      <EditorBrand />

      <template v-if="mode === 'design'">
        <div v-if="isDesktopLayout" class="add">
          <button type="button" class="ed-btn-outline" @click="handleAddTextElement('top_bar')">
            <UIcon name="i-lucide-plus" aria-hidden="true" />
            Texto
          </button>
          <button type="button" class="ed-btn-outline" @click="openFilePicker('file_picker')">
            <UIcon name="i-lucide-plus" aria-hidden="true" />
            Imagen
          </button>
        </div>

        <div class="topbar-right">
          <div
            v-if="isDesktopLayout"
            class="progress"
            role="img"
            :aria-label="`${filledPageIds.length} de ${PAGE_IDS.length} páginas con contenido`"
          >
            <span class="ticks">
              <span v-for="(filled, index) in pageTicks" :key="index" class="tick" :class="{ 'is-on': filled }" />
            </span>
            <span>{{ filledPageIds.length }} de {{ PAGE_IDS.length }} páginas</span>
          </div>
          <ZineToggle v-else v-model="state.previewGuides" class="guides-tablet">
            Guías
          </ZineToggle>

          <button
            type="button"
            class="ed-btn-primary"
            :class="{ 'is-quiet': filledPageIds.length === 0, 'is-small': !isDesktopLayout }"
            @click="openReview"
          >
            {{ isDesktopLayout ? 'Revisar e imprimir' : 'Revisar' }}
            <UIcon name="i-lucide-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </template>

      <template v-else>
        <FlowSteps v-if="isDesktopLayout" :current="isPdfReadyOpen ? 3 : 2" />

        <div class="topbar-right">
          <button v-if="isDesktopLayout" type="button" class="back" @click="backToDesign">
            <UIcon name="i-lucide-arrow-left" aria-hidden="true" />
            Volver a editar
          </button>
          <button
            type="button"
            class="ed-btn-primary"
            :class="{ 'is-small': !isDesktopLayout }"
            :disabled="isExporting"
            @click="downloadPdf('review')"
          >
            Descargar PDF
            <UIcon
              :name="isExporting ? 'i-lucide-loader-circle' : 'i-lucide-download'"
              :class="{ spinning: isExporting }"
              aria-hidden="true"
            />
          </button>
        </div>
      </template>
    </header>

    <div class="body">
      <PagesSidebar v-if="isDesktopLayout" class="pages-col" @reset="confirmReset" />

      <!-- Diseñar -->
      <section v-if="mode === 'design'" class="canvas-area" aria-label="Página">
        <div v-if="isDesktopLayout" class="canvas-head">
          <div class="page-nav">
            <button
              type="button"
              class="nav-arrow"
              aria-label="Página anterior"
              :disabled="!previousPageId"
              @click="goToPage(previousPageId)"
            >
              <UIcon name="i-lucide-chevron-left" aria-hidden="true" />
            </button>
            <div class="page-title">
              <h2>{{ pageTitle }}</h2>
              <p>{{ pageMeta }}</p>
            </div>
            <button
              type="button"
              class="nav-arrow"
              aria-label="Página siguiente"
              :disabled="!nextPageId"
              @click="goToPage(nextPageId)"
            >
              <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
            </button>
          </div>

          <div class="view-controls">
            <div class="ed-segment is-fit" role="group" aria-label="Vista del lienzo">
              <button
                type="button"
                class="ed-segment-item"
                :class="{ 'is-active': !showsSpread }"
                :aria-pressed="!showsSpread"
                @click="prefersSpread = false"
              >
                <UIcon name="i-lucide-file" aria-hidden="true" />
                <span class="view-label">Página</span>
              </button>
              <button
                type="button"
                class="ed-segment-item"
                :class="{ 'is-active': showsSpread }"
                :aria-pressed="showsSpread"
                :disabled="!canShowSpread"
                :title="canShowSpread ? undefined : 'Las tapas no tienen página enfrentada'"
                @click="prefersSpread = true"
              >
                <UIcon name="i-lucide-book-open" aria-hidden="true" />
                <span class="view-label">Doble</span>
              </button>
            </div>
            <ZineToggle v-model="state.previewGuides">
              Guías
            </ZineToggle>
          </div>
        </div>

        <div v-else class="page-head">
          <button
            type="button"
            class="nav-arrow"
            aria-label="Página anterior"
            :disabled="!previousPageId"
            @click="goToPage(previousPageId)"
          >
            <UIcon name="i-lucide-chevron-left" aria-hidden="true" />
          </button>
          <div class="page-title">
            <h2>{{ pageTitle }}</h2>
            <p>{{ pageIndex + 1 }} de {{ PAGE_IDS.length }}</p>
          </div>
          <button
            type="button"
            class="nav-arrow"
            aria-label="Página siguiente"
            :disabled="!nextPageId"
            @click="goToPage(nextPageId)"
          >
            <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div class="stage">
          <PageCanvas
            ref="pageCanvasRef"
            :spread="isDesktopLayout && showsSpread"
            :compact="!isDesktopLayout"
            @request-upload="openFilePicker"
            @add-text="handleAddTextElement('empty_state_link')"
          />
          <DropOverlay v-if="isDragActive" />
        </div>

        <!-- The row keeps its height when empty so the page does not jump on select. -->
        <div v-if="isDesktopLayout" class="hints" :class="{ 'is-hidden': isDragActive }">
          <p v-for="hint in hints" :key="hint.label" class="hint">
            <kbd class="ed-key">{{ hint.key }}</kbd>
            {{ hint.label }}
          </p>
        </div>
      </section>

      <!-- Revisar -->
      <section v-else class="canvas-area is-review ed-scroll" aria-label="Revisión del pliego">
        <div v-if="!isDesktopLayout" class="review-nav">
          <button type="button" class="back" @click="backToDesign">
            <UIcon name="i-lucide-arrow-left" aria-hidden="true" />
            Volver a editar
          </button>
          <FlowSteps :current="isPdfReadyOpen ? 3 : 2" />
        </div>

        <div class="canvas-head">
          <div class="page-title">
            <h2>Revisa antes de descargar</h2>
            <p>A4 horizontal · 297 × 210 mm</p>
          </div>
        </div>

        <div class="stage is-sheet">
          <div class="sheet-wrap">
            <SheetPreview review @select="backToDesign" />
          </div>
          <DropOverlay v-if="isDragActive" />
        </div>

        <div v-if="!isDesktopLayout" class="review-options ed-light">
          <ReviewPanel />
        </div>
      </section>

      <aside v-if="isDesktopLayout" class="inspector ed-light ed-scroll">
        <ElementInspector v-if="mode === 'design'" />
        <ReviewPanel v-else />
      </aside>

      <template v-else>
        <MobileBar
          v-if="mode === 'design'"
          @add-text="handleAddTextElement('mobile_bar')"
          @add-image="openFilePicker('mobile_bar')"
          @open-settings="mobileToolsOpen = true"
        />
        <PageStrip />
      </template>
    </div>

    <UDrawer
      v-model:open="mobileToolsOpen"
      title="Ajustes"
      description="Opciones del elemento seleccionado"
      :ui="{
        overlay: 'ed-drawer-overlay',
        content: 'ed-drawer ed-light max-h-[88dvh]',
        header: 'sr-only',
        body: 'overflow-y-auto'
      }"
    >
      <template #body>
        <ElementInspector />
      </template>
    </UDrawer>

    <PdfReadyDialog
      v-model:open="isPdfReadyOpen"
      @download-again="downloadPdf('pdf_ready_dialog')"
      @back-to-editor="backToDesign"
    />
  </div>
</template>

<style scoped>
/* Top bar */

.add {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-right {
  display: flex;
  flex: none;
  align-items: center;
  gap: 16px;
}

.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13px;
  line-height: 16px;
  white-space: nowrap;
}

.ticks {
  display: flex;
  gap: 3px;
}

.tick {
  width: 7px;
  height: 10px;
  background: var(--text-dark);
  transition: background 180ms ease;
}

.tick.is-on {
  background: var(--ink);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
  line-height: 19px;
  text-underline-offset: 5px;
}

.back:hover {
  text-decoration: underline;
}

.back .iconify {
  width: 16px;
  height: 16px;
}

.spinning {
  animation: ed-spin 900ms linear infinite;
}

@keyframes ed-spin {
  to {
    transform: rotate(360deg);
  }
}

/* The previewGuides toggle lives in the canvas header on desktop. Tablets keep
   it in the top bar, where it was before; phones never had it. */
.guides-tablet {
  display: none;
}

@media (min-width: 768px) {
  .guides-tablet {
    display: inline-flex;
  }
}

/* Body */

.body {
  display: flex;
  min-height: 0;
  flex: 1;
}

.is-mobile .body {
  flex-direction: column;
}

.pages-col {
  flex: none;
  width: 272px;
}

.inspector {
  flex: none;
  width: 320px;
  padding: 20px;
  overflow-y: auto;
}

.canvas-area {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--ed-canvas);
  container-type: inline-size;
}

.canvas-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 68px;
  padding: 0 24px;
}

.is-review .canvas-head {
  height: 66px;
}

.page-nav {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.nav-arrow {
  display: grid;
  flex: none;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  transition: border-color 180ms ease;
}

.nav-arrow:hover:not(:disabled) {
  border-color: var(--ink);
}

.nav-arrow:disabled {
  color: var(--ed-dim);
}

.nav-arrow .iconify {
  width: 18px;
  height: 18px;
}

.page-title {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.page-title h2 {
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-title p {
  margin: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-controls {
  display: flex;
  flex: none;
  align-items: center;
  gap: 16px;
}

.ed-segment.is-fit .ed-segment-item {
  flex: none;
  padding: 7px 10px;
}

/* Small laptops: the view switch keeps its icons and drops the words. */
@container (max-width: 620px) {
  .view-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .ed-segment.is-fit .ed-segment-item {
    padding: 8px 10px;
  }
}

.stage {
  position: relative;
  min-height: 0;
  flex: 1;
}

.hints {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 24px;
  height: 41px;
  padding: 0 24px;
}

.hints.is-hidden {
  visibility: hidden;
}

.hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 16px;
}

/* Review: the sheet, large */

.stage.is-sheet {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* As wide as the column allows, without growing taller than the space under the headers. */
.sheet-wrap {
  width: min(100%, (100dvh - 178px) * 297 / 210);
}

/* Mobile */

.page-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
}

.page-head .nav-arrow {
  width: 36px;
  height: 36px;
  border: 0;
}

.page-head .nav-arrow .iconify {
  width: 20px;
  height: 20px;
}

.page-head .page-title {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.page-head .page-title h2 {
  font-size: 15px;
  line-height: 19px;
}

.is-mobile .canvas-area.is-review {
  overflow-y: auto;
}

.is-mobile .canvas-area.is-review .canvas-head {
  height: auto;
  padding: 4px 12px 12px;
}

.is-mobile .stage.is-sheet {
  flex: none;
  padding: 0 20px 26px 12px;
}

.is-mobile .sheet-wrap {
  width: 100%;
}

.review-nav {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 12px 16px;
}

.review-nav .back {
  font-size: 14px;
  line-height: 18px;
}

.review-options {
  flex: none;
  padding: 20px 12px 24px;
}
</style>

<style>
/* The drawer is teleported to <body>, outside the editor shell and this component's scope. */
.ed-drawer-overlay {
  background: rgb(11 10 9 / 80%);
}

.ed-drawer {
  border-top: 2px solid var(--ink-dark);
  border-radius: 0;
  box-shadow: none;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.25;
}
</style>
