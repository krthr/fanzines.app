<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_LABELS } from '~/types/zine'
import { PANEL_SIZE_LABEL, formatMmSize } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineElementActions } from '~/composables/useZineElementActions.client'

// The mobile context bar: the selection's actions, or the two ways to add
// something when nothing is selected.
const emit = defineEmits<{
  'add-text': []
  'add-image': []
  'open-settings': []
}>()

const { state, selectedElement } = useZineStore()
const { coverPage, containPage, bringForward, sendBackward, removeSelected } = useZineElementActions()

const title = computed(() => {
  if (!selectedElement.value) return PAGE_LABELS[state.value.selectedPageId]
  return selectedElement.value.type === 'image' ? 'Imagen' : 'Texto'
})

const sizeLabel = computed(() => selectedElement.value
  ? formatMmSize(selectedElement.value.width, selectedElement.value.height)
  : PANEL_SIZE_LABEL)
</script>

<template>
  <div class="bar ed-light">
    <div class="info">
      <p class="info-title">
        {{ title }}
      </p>
      <p class="info-size">
        {{ sizeLabel }}
      </p>
    </div>

    <div v-if="selectedElement" class="actions">
      <template v-if="selectedElement.type === 'image'">
        <button type="button" class="action" @click="coverPage">
          <UIcon name="i-lucide-expand" aria-hidden="true" />
          Rellenar
        </button>
        <button type="button" class="action" @click="containPage">
          <UIcon name="i-lucide-scan" aria-hidden="true" />
          Encajar
        </button>
      </template>
      <button type="button" class="action" @click="bringForward">
        <UIcon name="i-lucide-bring-to-front" aria-hidden="true" />
        Al frente
      </button>
      <button type="button" class="action" @click="sendBackward">
        <UIcon name="i-lucide-send-to-back" aria-hidden="true" />
        Atrás
      </button>
      <button type="button" class="action" @click="emit('open-settings')">
        <UIcon name="i-lucide-sliders-horizontal" aria-hidden="true" />
        Ajustes
      </button>
      <button type="button" class="action is-danger" @click="removeSelected('mobile_bar')">
        <UIcon name="i-lucide-trash-2" aria-hidden="true" />
        Borrar
      </button>
    </div>

    <div v-else class="actions">
      <button type="button" class="action" @click="emit('add-text')">
        <UIcon name="i-lucide-type" aria-hidden="true" />
        + Texto
      </button>
      <button type="button" class="action" @click="emit('add-image')">
        <UIcon name="i-lucide-image-plus" aria-hidden="true" />
        + Foto
      </button>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px 8px;
}

.info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 8px;
}

.info-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 1px;
  line-height: 23px;
  text-transform: uppercase;
}

.info-size {
  margin: 0;
  color: var(--text-dark);
  font-family: var(--font-type);
  font-size: 13px;
  line-height: 13px;
}

.actions {
  display: flex;
}

.action {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--ink-dark);
  font-size: 12px;
  font-weight: 600;
  line-height: 15px;
  white-space: nowrap;
}

.action:active {
  background: rgb(11 10 9 / 10%);
}

.action .iconify {
  width: 20px;
  height: 20px;
}

.action.is-danger {
  color: var(--orange-deep);
}
</style>
