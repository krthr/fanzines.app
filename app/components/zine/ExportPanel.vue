<script setup lang="ts">
import { computed, ref } from 'vue'
import { exportZinePdf } from '~/utils/exportPdf.client'
import { useZineStore } from '~/composables/useZineStore'

const { state, elementCount } = useZineStore()

const isExporting = ref(false)
const errorMessage = ref('')
const elementCountLabel = computed(() => (
  elementCount.value === 1
    ? '1 elemento en el fanzine.'
    : `${elementCount.value} elementos en el fanzine.`
))

const exportGuides = computed({
  get: () => state.value.exportGuides,
  set: (value: boolean) => {
    state.value.exportGuides = value
  }
})

async function handleExport() {
  errorMessage.value = ''
  isExporting.value = true

  try {
    await exportZinePdf(state.value)
  } catch {
    errorMessage.value = 'No se pudo generar el PDF. Revisa las imágenes cargadas e inténtalo de nuevo.'
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <section class="zine-export-panel space-y-4">
    <div>
      <h2 class="text-sm font-semibold text-default">
        Exportar
      </h2>
      <p class="mt-1 text-xs leading-5 text-muted">
        PDF A4 horizontal, listo para imprimir, cortar y doblar.
      </p>
    </div>

    <USwitch
      v-model="exportGuides"
      label="Incluir guías"
      size="md"
      color="primary"
    />

    <UButton
      block
      icon="i-lucide-download"
      label="Descargar PDF"
      :loading="isExporting"
      @click="handleExport"
    />

    <p class="text-xs text-muted">
      {{ elementCountLabel }}
    </p>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :description="errorMessage"
    />
  </section>
</template>
