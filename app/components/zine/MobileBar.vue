<script setup lang="ts">
import { computed } from 'vue'
import type { ShapeKind } from '~/types/zine'
import { PANEL_SIZE_LABEL, formatElementSize } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineElementActions } from '~/composables/useZineElementActions.client'
import { useZinePageLabels } from '~/composables/useZinePageLabels'
import AddShapeMenu from '~/components/zine/AddShapeMenu.vue'

// The mobile context bar: the selection's actions, or the ways to add something when
// nothing is selected. "Layouts" opens the drawer, where the catalog shows while
// nothing is selected.
const emit = defineEmits<{
  'add-text': []
  'add-image': []
  'add-shape': [kind: ShapeKind]
  'open-settings': []
  'open-layouts': []
}>()

const { t } = useI18n()
const { state, selectedElement } = useZineStore()
const { pageLabel } = useZinePageLabels()
const { coverPage, containPage, bringForward, sendBackward, removeSelected } = useZineElementActions()

const title = computed(() => {
  const element = selectedElement.value
  if (!element) return pageLabel(state.value.selectedPageId)
  if (element.type === 'image') return t('editor.inspector.image')
  if (element.type === 'text') return t('editor.inspector.text')
  return t(`editor.shapes.${element.type}`)
})

const sizeLabel = computed(() => selectedElement.value
  ? formatElementSize(selectedElement.value.type, selectedElement.value.width, selectedElement.value.height)
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
          {{ t('editor.actions.fill') }}
        </button>
        <button type="button" class="action" @click="containPage">
          <UIcon name="i-lucide-scan" aria-hidden="true" />
          {{ t('editor.actions.fit') }}
        </button>
      </template>
      <button type="button" class="action" @click="bringForward">
        <UIcon name="i-lucide-bring-to-front" aria-hidden="true" />
        {{ t('editor.actions.forward') }}
      </button>
      <button type="button" class="action" @click="sendBackward">
        <UIcon name="i-lucide-send-to-back" aria-hidden="true" />
        {{ t('editor.actions.backward') }}
      </button>
      <button type="button" class="action" @click="emit('open-settings')">
        <UIcon name="i-lucide-sliders-horizontal" aria-hidden="true" />
        {{ t('editor.actions.settings') }}
      </button>
      <button type="button" class="action is-danger" @click="removeSelected('mobile_bar')">
        <UIcon name="i-lucide-trash-2" aria-hidden="true" />
        {{ t('editor.actions.deleteShort') }}
      </button>
    </div>

    <div v-else class="actions">
      <button type="button" class="action" @click="emit('add-text')">
        <UIcon name="i-lucide-type" aria-hidden="true" />
        {{ t('editor.actions.addText') }}
      </button>
      <button type="button" class="action" @click="emit('add-image')">
        <UIcon name="i-lucide-image-plus" aria-hidden="true" />
        {{ t('editor.actions.addPhoto') }}
      </button>
      <AddShapeMenu side="top" @add="emit('add-shape', $event)">
        <button type="button" class="action">
          <UIcon name="i-lucide-shapes" aria-hidden="true" />
          {{ t('editor.actions.addShape') }}
        </button>
      </AddShapeMenu>
      <button type="button" class="action" @click="emit('open-layouts')">
        <UIcon name="i-lucide-layout-template" aria-hidden="true" />
        {{ t('editor.actions.layouts') }}
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
