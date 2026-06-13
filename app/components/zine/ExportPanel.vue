<script setup lang="ts">
import { computed, ref } from 'vue'
import { exportZinePdf } from '~/utils/exportPdf.client'
import { useZineStore } from '~/composables/useZineStore'

const { state, elementCount } = useZineStore()

const isExporting = ref(false)
const errorMessage = ref('')

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
  <section class="space-y-4">
    <div>
      <h2 class="text-sm font-semibold text-default">
        Exportar
      </h2>
      <p class="mt-1 text-xs leading-5 text-muted">
        PDF A4 horizontal, generado localmente.
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
      label="Exportar PDF"
      :loading="isExporting"
      @click="handleExport"
    />

    <p class="text-xs text-muted">
      {{ elementCount }} elementos en el fanzine.
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
