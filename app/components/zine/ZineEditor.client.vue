<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ElementInspector from '~/components/zine/ElementInspector.vue'
import ExportPanel from '~/components/zine/ExportPanel.vue'
import PageCanvas from '~/components/zine/PageCanvas.vue'
import PageSelector from '~/components/zine/PageSelector.vue'
import SheetPreview from '~/components/zine/SheetPreview.vue'
import { PAGE_LABELS, type ImageBatchSkippedFile } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'

const {
  state,
  elementCount,
  selectedElement,
  addImageElements,
  addTextElement,
  deleteElement,
  selectElement,
  resetZine
} = useZineStore()

const toast = useToast()
const { trackZineEvent } = useZineAnalytics()
const fileInput = ref<HTMLInputElement | null>(null)
const mobileToolsOpen = ref(false)
const isDesktopLayout = ref(import.meta.client ? window.matchMedia('(min-width: 1024px)').matches : false)

let desktopMediaQuery: MediaQueryList | null = null
let removeDesktopMediaQueryListener: (() => void) | null = null

const activePageLabel = computed(() => PAGE_LABELS[state.value.selectedPageId])

const previewGuides = computed({
  get: () => state.value.previewGuides,
  set: (value: boolean) => {
    state.value.previewGuides = value
  }
})

function openFilePicker() {
  fileInput.value?.click()
}

function handleAddTextElement() {
  const pageId = state.value.selectedPageId

  addTextElement()
  trackZineEvent('zine_text_element_added', {
    page_id: pageId,
    element_count: elementCount.value
  })
}

function formatSkippedFiles(files: ImageBatchSkippedFile[]) {
  const names = files.slice(0, 3).map((file) => file.fileName).join(', ')
  const extraCount = files.length - 3

  return extraCount > 0 ? `${names} y ${extraCount} más` : names
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (files.length === 0) return

  const initialPageId = state.value.selectedPageId
  const result = await addImageElements(files)
  const failedFiles = result.skippedFiles.filter((file) => file.reason !== 'no-page')
  const skippedCount = result.skippedFiles.length

  trackZineEvent('zine_images_uploaded', {
    page_id: initialPageId,
    file_count: files.length,
    imported_count: result.importedCount,
    skipped_count: skippedCount,
    failed_count: failedFiles.length,
    overflow_count: result.overflowCount,
    large_file_count: result.largeFileCount,
    status: result.importedCount === files.length ? 'succeeded' : result.importedCount > 0 ? 'partial' : 'failed',
    element_count: elementCount.value
  })

  if (failedFiles.length > 0) {
    toast.add({
      color: 'error',
      icon: 'i-lucide-triangle-alert',
      title: failedFiles.length === 1 ? 'Imagen no cargada' : 'Algunas imágenes no se cargaron',
      description: `Se omitieron ${failedFiles.length} archivo${failedFiles.length === 1 ? '' : 's'}: ${formatSkippedFiles(failedFiles)}.`
    })
  }

  if (result.overflowCount > 0) {
    toast.add({
      color: 'warning',
      icon: 'i-lucide-info',
      title: 'No caben todas las imágenes',
      description: `Se omitieron ${result.overflowCount} archivo${result.overflowCount === 1 ? '' : 's'} porque no quedaban páginas disponibles.`
    })
  }

  if (result.largeFileCount > 0) {
    toast.add({
      color: 'warning',
      icon: 'i-lucide-info',
      title: result.largeFileCount === 1 ? 'Imagen grande' : 'Imágenes grandes',
      description: result.largeFileCount === 1
        ? 'La imagen es grande; si notas lentitud, conviene usar una versión reducida.'
        : `${result.largeFileCount} imágenes son grandes; si notas lentitud, conviene usar versiones reducidas.`
    })
  }
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

  if (isTyping) return

  if (event.key === 'Escape') {
    selectElement(null)
  }

  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement.value) {
    const element = selectedElement.value

    event.preventDefault()
    deleteElement(element.id)
    trackZineEvent('zine_element_deleted', {
      page_id: element.pageId,
      element_type: element.type,
      input_method: 'keyboard',
      element_count: elementCount.value
    })
  }
}

onMounted(() => {
  desktopMediaQuery = window.matchMedia('(min-width: 1024px)')
  const syncDesktopLayout = () => {
    isDesktopLayout.value = Boolean(desktopMediaQuery?.matches)
  }

  syncDesktopLayout()
  desktopMediaQuery.addEventListener('change', syncDesktopLayout)
  removeDesktopMediaQueryListener = () => desktopMediaQuery?.removeEventListener('change', syncDesktopLayout)
  window.addEventListener('keydown', handleKeydown)
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
})
</script>

<template>
  <div class="zine-shell min-h-dvh">
    <input
      ref="fileInput"
      class="hidden"
      type="file"
      accept="image/*"
      multiple
      @change="handleFileChange"
    >

    <header class="zine-editor-header flex h-auto min-h-16 flex-wrap items-center gap-3 px-3 py-2 lg:h-16 lg:px-4">
      <div class="flex min-w-0 items-center gap-3">
        <div class="zine-editor-mark grid size-10 place-items-center text-sm font-black">
          FZ
        </div>
        <div class="min-w-0">
          <p class="m-0 truncate text-base font-semibold leading-5 text-default">
            Editor de fanzines
          </p>
          <p class="truncate text-xs text-muted">
            Pliego A4 · {{ activePageLabel }}
          </p>
        </div>
      </div>

      <div class="flex flex-1 flex-wrap items-center justify-end gap-2">
        <UButton
          icon="i-lucide-image-plus"
          label="Subir imágenes"
          variant="outline"
          size="sm"
          class="zine-toolbar-button"
          @click="openFilePicker"
        />
        <UButton
          icon="i-lucide-type"
          label="Añadir texto"
          variant="soft"
          size="sm"
          class="zine-toolbar-button"
          @click="handleAddTextElement"
        />
        <USwitch
          v-model="previewGuides"
          label="Guías"
          size="sm"
          class="zine-contrast-switch hidden md:flex"
        />
        <UDrawer
          v-model:open="mobileToolsOpen"
          title="Propiedades"
          description="Ajustes del panel activo"
          :ui="{ content: 'max-h-[88dvh]', body: 'space-y-6 overflow-y-auto' }"
        >
          <UButton
            icon="i-lucide-sliders-horizontal"
            label="Propiedades"
            variant="outline"
            size="sm"
            class="zine-toolbar-button lg:hidden"
          />
          <template #body>
            <ElementInspector />
            <div class="border-t border-muted pt-5">
              <ExportPanel />
            </div>
          </template>
        </UDrawer>
      </div>
    </header>

    <section class="zine-editor-grid">
      <aside class="zine-scrollbar zine-panel hidden overflow-y-auto p-4 lg:block">
        <div class="space-y-5">
          <section class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-semibold text-default">
                Paneles
              </h2>
              <UButton
                icon="i-lucide-refresh-cw"
                variant="ghost"
                color="neutral"
                size="xs"
                aria-label="Reiniciar fanzine"
                @click="confirmReset"
              />
            </div>
            <PageSelector />
          </section>

          <section class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-semibold text-default">
                Vista del pliego
              </h2>
              <USwitch
                v-model="previewGuides"
                size="sm"
                aria-label="Mostrar guías"
                class="zine-contrast-switch"
              />
            </div>
            <SheetPreview v-if="isDesktopLayout" />
          </section>
        </div>
      </aside>

      <section class="zine-workspace flex min-h-[calc(100dvh-67px)] min-w-0 flex-col">
        <div class="zine-workbar flex items-center justify-between gap-3 px-4 py-2">
          <div class="min-w-0">
            <h2 class="truncate text-sm font-semibold text-default">
              {{ activePageLabel }}
            </h2>
            <p class="truncate text-xs text-muted">
              {{ selectedElement ? 'Elemento seleccionado' : 'Sin selección' }}
            </p>
          </div>
          <UButton
            icon="i-lucide-maximize"
            label="Centrar"
            variant="ghost"
            color="neutral"
            size="xs"
            class="zine-toolbar-button"
            @click="selectElement(null)"
          />
        </div>

        <div class="min-h-0 flex-1">
          <PageCanvas />
        </div>

        <div class="zine-mobile-panel space-y-3 p-3 lg:hidden">
          <PageSelector compact />
          <div class="mx-auto max-w-sm">
            <SheetPreview v-if="!isDesktopLayout" />
          </div>
        </div>
      </section>

      <aside class="zine-scrollbar zine-panel hidden overflow-y-auto p-4 lg:block">
        <div class="space-y-6">
          <ElementInspector />
          <div class="border-t border-muted pt-5">
            <ExportPanel />
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>
