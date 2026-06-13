<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ElementInspector from '~/components/zine/ElementInspector.vue'
import ExportPanel from '~/components/zine/ExportPanel.vue'
import PageCanvas from '~/components/zine/PageCanvas.vue'
import PageSelector from '~/components/zine/PageSelector.vue'
import SheetPreview from '~/components/zine/SheetPreview.vue'
import { PAGE_LABELS } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'

const {
  state,
  selectedElement,
  addImageElement,
  addTextElement,
  deleteElement,
  selectElement,
  resetZine
} = useZineStore()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const mobileToolsOpen = ref(false)

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

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) return

  const result = await addImageElement(file)

  if (!result.ok) {
    toast.add({
      color: 'error',
      icon: 'i-lucide-triangle-alert',
      title: 'Imagen no cargada',
      description: result.error
    })
    return
  }

  if (result.warning) {
    toast.add({
      color: 'warning',
      icon: 'i-lucide-info',
      title: 'Imagen grande',
      description: result.warning
    })
  }
}

function confirmReset() {
  if (window.confirm('¿Reiniciar el fanzine y eliminar todos los elementos?')) {
    resetZine()
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
    event.preventDefault()
    deleteElement(selectedElement.value.id)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main class="zine-shell min-h-dvh">
    <input
      ref="fileInput"
      class="hidden"
      type="file"
      accept="image/*"
      @change="handleFileChange"
    >

    <header class="flex h-auto min-h-14 flex-wrap items-center gap-3 border-b border-muted bg-default/88 px-3 py-2 backdrop-blur lg:h-14 lg:px-4">
      <div class="flex min-w-0 items-center gap-3">
        <div class="grid size-9 place-items-center rounded-md border border-muted bg-[var(--zine-paper)] text-sm font-black text-default">
          FZ
        </div>
        <div class="min-w-0">
          <h1 class="truncate text-base font-semibold leading-5 text-default">
            Editor de fanzines
          </h1>
          <p class="truncate text-xs text-muted">
            Pliego A4 · {{ activePageLabel }}
          </p>
        </div>
      </div>

      <div class="flex flex-1 flex-wrap items-center justify-end gap-2">
        <UButton
          icon="i-lucide-image-plus"
          label="Subir imagen"
          variant="outline"
          size="sm"
          @click="openFilePicker"
        />
        <UButton
          icon="i-lucide-type"
          label="Añadir texto"
          variant="soft"
          size="sm"
          @click="addTextElement"
        />
        <USwitch
          v-model="previewGuides"
          label="Guías"
          size="sm"
          class="hidden md:flex"
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
            class="lg:hidden"
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
              <USwitch v-model="previewGuides" size="sm" aria-label="Mostrar guías" />
            </div>
            <SheetPreview />
          </section>
        </div>
      </aside>

      <section class="flex min-h-[calc(100dvh-57px)] min-w-0 flex-col">
        <div class="flex items-center justify-between gap-3 border-b border-muted bg-default/58 px-4 py-2">
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
            @click="selectElement(null)"
          />
        </div>

        <div class="min-h-0 flex-1">
          <PageCanvas />
        </div>

        <div class="space-y-3 border-t border-muted bg-default/78 p-3 lg:hidden">
          <PageSelector compact />
          <div class="mx-auto max-w-sm">
            <SheetPreview />
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
  </main>
</template>
