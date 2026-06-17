<script setup lang="ts">
import { computed } from 'vue'
import type { FontOption, ZineElement } from '~/types/zine'
import { FONT_OPTIONS, PAGE_LABELS } from '~/types/zine'
import { PAGE_H, PAGE_W } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'

type ImageElement = Extract<ZineElement, { type: 'image' }>
type HorizontalPositionAlignment = 'left' | 'center' | 'right'
type VerticalPositionAlignment = 'top' | 'middle' | 'bottom'

const ALIGNMENT_EPSILON = 1

const {
  state,
  elementCount,
  selectedElement,
  updateElement,
  deleteElement,
  moveElementForward,
  moveElementBackward
} = useZineStore()
const { trackZineEvent } = useZineAnalytics()

const fontItems = FONT_OPTIONS.map((font) => ({ label: font, value: font }))
const styleItems = [
  { label: 'Normal', value: 'normal' },
  { label: 'Negrita', value: 'bold' },
  { label: 'Cursiva', value: 'italic' }
]
const textAlignItems = [
  { label: 'Izquierda', value: 'left', icon: 'i-lucide-align-left' },
  { label: 'Centro', value: 'center', icon: 'i-lucide-align-center' },
  { label: 'Derecha', value: 'right', icon: 'i-lucide-align-right' }
]
const positionHorizontalAlignItems = [
  { label: 'Izq.', value: 'left', icon: 'i-lucide-align-horizontal-justify-start' },
  { label: 'Centro', value: 'center', icon: 'i-lucide-align-horizontal-justify-center' },
  { label: 'Der.', value: 'right', icon: 'i-lucide-align-horizontal-justify-end' }
] satisfies Array<{ label: string, value: HorizontalPositionAlignment, icon: string }>
const positionVerticalAlignItems = [
  { label: 'Arriba', value: 'top', icon: 'i-lucide-align-vertical-justify-start' },
  { label: 'Medio', value: 'middle', icon: 'i-lucide-align-vertical-justify-center' },
  { label: 'Abajo', value: 'bottom', icon: 'i-lucide-align-vertical-justify-end' }
] satisfies Array<{ label: string, value: VerticalPositionAlignment, icon: string }>

const activePageLabel = computed(() => PAGE_LABELS[state.value.selectedPageId])

function fontPreviewStyle(value: unknown) {
  return {
    fontFamily: typeof value === 'string' ? value : undefined
  }
}

function fontLabel(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function patch(patch: Partial<ZineElement> | Record<string, unknown>) {
  if (!selectedElement.value) return
  updateElement(selectedElement.value.id, patch as Partial<ZineElement>)
}

function patchNumber(key: string, value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return
  patch({ [key]: value } as Partial<ZineElement>)
}

function patchOpacity(value: number | number[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value
  if (typeof next !== 'number') return
  patch({ opacity: next / 100 })
}

function isImageElement(element: ZineElement | null): element is ImageElement {
  return element?.type === 'image'
}

function elementX(element: ZineElement, alignment: HorizontalPositionAlignment) {
  if (alignment === 'left') return 0
  if (alignment === 'center') return (PAGE_W - element.width) / 2
  return PAGE_W - element.width
}

function elementY(element: ZineElement, alignment: VerticalPositionAlignment) {
  if (alignment === 'top') return 0
  if (alignment === 'middle') return (PAGE_H - element.height) / 2
  return PAGE_H - element.height
}

function imageSourceSize(element: ImageElement) {
  return {
    width: element.naturalWidth || element.width,
    height: element.naturalHeight || element.height
  }
}

function centeredImageBounds(sourceWidth: number, sourceHeight: number, scale: number) {
  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    x: (PAGE_W - width) / 2,
    y: (PAGE_H - height) / 2,
    width,
    height
  }
}

function containedImageBounds(element: ImageElement) {
  const source = imageSourceSize(element)
  return centeredImageBounds(
    source.width,
    source.height,
    Math.min(PAGE_W / source.width, PAGE_H / source.height)
  )
}

function coveredImageBounds(element: ImageElement) {
  const source = imageSourceSize(element)
  return centeredImageBounds(
    source.width,
    source.height,
    Math.max(PAGE_W / source.width, PAGE_H / source.height)
  )
}

function isAligned(value: number, target: number) {
  return Math.abs(value - target) < ALIGNMENT_EPSILON
}

function hasHorizontalElementMovement(element: ZineElement) {
  return positionHorizontalAlignItems.some((item) => !isAligned(element.x, elementX(element, item.value)))
}

function hasVerticalElementMovement(element: ZineElement) {
  return positionVerticalAlignItems.some((item) => !isAligned(element.y, elementY(element, item.value)))
}

function fillImagePage() {
  const element = selectedElement.value
  if (!isImageElement(element)) return

  updateElement(element.id, {
    ...containedImageBounds(element),
    rotation: 0
  })
}

function coverImagePage() {
  const element = selectedElement.value
  if (!isImageElement(element)) return

  updateElement(element.id, {
    ...coveredImageBounds(element),
    rotation: 0
  })
}

function alignElementHorizontal(alignment: HorizontalPositionAlignment) {
  const element = selectedElement.value
  if (!element || !hasHorizontalElementMovement(element)) return

  updateElement(element.id, {
    x: elementX(element, alignment)
  })
}

function alignElementVertical(alignment: VerticalPositionAlignment) {
  const element = selectedElement.value
  if (!element || !hasVerticalElementMovement(element)) return

  updateElement(element.id, {
    y: elementY(element, alignment)
  })
}

function canAlignElementHorizontal() {
  const element = selectedElement.value
  return Boolean(element && hasHorizontalElementMovement(element))
}

function canAlignElementVertical() {
  const element = selectedElement.value
  return Boolean(element && hasVerticalElementMovement(element))
}

function isElementHorizontallyAligned(alignment: HorizontalPositionAlignment) {
  const element = selectedElement.value
  return Boolean(element
    && hasHorizontalElementMovement(element)
    && isAligned(element.x, elementX(element, alignment)))
}

function isElementVerticallyAligned(alignment: VerticalPositionAlignment) {
  const element = selectedElement.value
  return Boolean(element
    && hasVerticalElementMovement(element)
    && isAligned(element.y, elementY(element, alignment)))
}

function removeSelected() {
  if (!selectedElement.value) return

  const element = selectedElement.value

  deleteElement(element.id)
  trackZineEvent('zine_element_deleted', {
    page_id: element.pageId,
    element_type: element.type,
    input_method: 'inspector',
    element_count: elementCount.value
  })
}

function bringForward() {
  if (!selectedElement.value) return
  moveElementForward(selectedElement.value.id)
}

function sendBackward() {
  if (!selectedElement.value) return
  moveElementBackward(selectedElement.value.id)
}
</script>

<template>
  <section class="zine-inspector space-y-5">
    <div>
      <h2 class="text-sm font-semibold text-default">
        Propiedades
      </h2>
      <p class="mt-1 text-xs leading-5 text-muted">
        {{ selectedElement ? (selectedElement.type === 'image' ? 'Imagen seleccionada' : 'Texto seleccionado') : activePageLabel }}
      </p>
    </div>

    <div v-if="!selectedElement" class="zine-empty-state p-4 text-sm leading-6">
      Selecciona un texto o una imagen para editar sus medidas, posición y estilo.
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-3">
        <UFormField label="X">
          <UInputNumber
            :model-value="Math.round(selectedElement.x)"
            :min="-PAGE_W"
            :max="PAGE_W * 2"
            :step="10"
            class="w-full"
            @update:model-value="(value) => patchNumber('x', value)"
          />
        </UFormField>

        <UFormField label="Y">
          <UInputNumber
            :model-value="Math.round(selectedElement.y)"
            :min="-PAGE_H"
            :max="PAGE_H * 2"
            :step="10"
            class="w-full"
            @update:model-value="(value) => patchNumber('y', value)"
          />
        </UFormField>

        <UFormField label="Ancho">
          <UInputNumber
            :model-value="Math.round(selectedElement.width)"
            :min="20"
            :max="PAGE_W * 2"
            :step="10"
            class="w-full"
            @update:model-value="(value) => patchNumber('width', value)"
          />
        </UFormField>

        <UFormField label="Alto">
          <UInputNumber
            :model-value="Math.round(selectedElement.height)"
            :min="20"
            :max="PAGE_H * 2"
            :step="10"
            class="w-full"
            @update:model-value="(value) => patchNumber('height', value)"
          />
        </UFormField>
      </div>

      <UFormField label="Rotación">
        <div class="flex items-center gap-3">
          <USlider
            :model-value="selectedElement.rotation"
            :min="-180"
            :max="180"
            :step="1"
            class="min-w-0 flex-1"
            @update:model-value="(value) => patchNumber('rotation', Array.isArray(value) ? value[0] : value)"
          />
          <span class="w-12 text-right text-xs tabular-nums text-muted">{{ Math.round(selectedElement.rotation) }}°</span>
        </div>
      </UFormField>

      <UFormField label="Opacidad">
        <div class="flex items-center gap-3">
          <USlider
            :model-value="Math.round(selectedElement.opacity * 100)"
            :min="10"
            :max="100"
            :step="1"
            class="min-w-0 flex-1"
            @update:model-value="patchOpacity"
          />
          <span class="w-12 text-right text-xs tabular-nums text-muted">{{ Math.round(selectedElement.opacity * 100) }}%</span>
        </div>
      </UFormField>

      <template v-if="selectedElement.type === 'text'">
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Fuente">
            <USelect
              :model-value="selectedElement.fontFamily"
              :items="fontItems"
              value-key="value"
              class="w-full"
              @update:model-value="(value) => patch({ fontFamily: value as FontOption } as Partial<ZineElement>)"
            >
              <template #default="{ modelValue }">
                <span class="block truncate" :style="fontPreviewStyle(modelValue)">
                  {{ fontLabel(modelValue) }}
                </span>
              </template>

              <template #item-label="{ item }">
                <span class="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                  <span class="truncate" :style="fontPreviewStyle(item.value)">
                    {{ item.label }}
                  </span>
                  <span class="shrink-0 text-xs text-muted" :style="fontPreviewStyle(item.value)">
                    Aa
                  </span>
                </span>
              </template>
            </USelect>
          </UFormField>

          <UFormField label="Estilo">
            <USelect
              :model-value="selectedElement.fontStyle"
              :items="styleItems"
              class="w-full"
              @update:model-value="(value) => patch({ fontStyle: value as 'normal' | 'bold' | 'italic' })"
            />
          </UFormField>

          <UFormField label="Tamaño">
            <UInputNumber
              :model-value="selectedElement.fontSize"
              :min="12"
              :max="220"
              :step="2"
              class="w-full"
              @update:model-value="(value) => patchNumber('fontSize', value)"
            />
          </UFormField>

          <UFormField label="Color">
            <input
              class="zine-input-color"
              type="color"
              :value="selectedElement.fill"
              @input="(event) => patch({ fill: (event.target as HTMLInputElement).value })"
            >
          </UFormField>
        </div>

        <UFormField label="Alinear texto">
          <div class="grid grid-cols-3 gap-2">
            <UButton
              v-for="item in textAlignItems"
              :key="item.value"
              :icon="item.icon"
              :label="item.label"
              :color="selectedElement.align === item.value ? 'primary' : 'neutral'"
              :variant="selectedElement.align === item.value ? 'solid' : 'outline'"
              size="sm"
              block
              @click="patch({ align: item.value as 'left' | 'center' | 'right' })"
            />
          </div>
        </UFormField>

        <div class="space-y-3">
          <UFormField label="Alinear horizontal">
            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="item in positionHorizontalAlignItems"
                :key="item.value"
                :icon="item.icon"
                :label="item.label"
                :color="isElementHorizontallyAligned(item.value) ? 'primary' : 'neutral'"
                :variant="isElementHorizontallyAligned(item.value) ? 'solid' : 'outline'"
                size="sm"
                block
                :disabled="!canAlignElementHorizontal()"
                @click="alignElementHorizontal(item.value)"
              />
            </div>
          </UFormField>

          <UFormField label="Alinear vertical">
            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="item in positionVerticalAlignItems"
                :key="item.value"
                :icon="item.icon"
                :label="item.label"
                :color="isElementVerticallyAligned(item.value) ? 'primary' : 'neutral'"
                :variant="isElementVerticallyAligned(item.value) ? 'solid' : 'outline'"
                size="sm"
                block
                :disabled="!canAlignElementVertical()"
                @click="alignElementVertical(item.value)"
              />
            </div>
          </UFormField>
        </div>
      </template>

      <template v-else>
        <div class="zine-element-card p-3">
          <p class="truncate text-sm font-medium text-default">
            {{ selectedElement.fileName || 'Imagen' }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ selectedElement.naturalWidth }} x {{ selectedElement.naturalHeight }} px
          </p>
        </div>

        <div class="space-y-3">
          <UButton
            block
            icon="i-lucide-expand"
            label="Encajar en página"
            color="primary"
            variant="solid"
            size="sm"
            @click="fillImagePage"
          />

          <UButton
            block
            icon="i-lucide-maximize"
            label="Rellenar página"
            color="secondary"
            variant="solid"
            size="sm"
            @click="coverImagePage"
          />

          <UFormField label="Alinear horizontal">
            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="item in positionHorizontalAlignItems"
                :key="item.value"
                :icon="item.icon"
                :label="item.label"
                :color="isElementHorizontallyAligned(item.value) ? 'primary' : 'neutral'"
                :variant="isElementHorizontallyAligned(item.value) ? 'solid' : 'outline'"
                size="sm"
                block
                :disabled="!canAlignElementHorizontal()"
                @click="alignElementHorizontal(item.value)"
              />
            </div>
          </UFormField>

          <UFormField label="Alinear vertical">
            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="item in positionVerticalAlignItems"
                :key="item.value"
                :icon="item.icon"
                :label="item.label"
                :color="isElementVerticallyAligned(item.value) ? 'primary' : 'neutral'"
                :variant="isElementVerticallyAligned(item.value) ? 'solid' : 'outline'"
                size="sm"
                block
                :disabled="!canAlignElementVertical()"
                @click="alignElementVertical(item.value)"
              />
            </div>
          </UFormField>
        </div>
      </template>

      <div class="grid grid-cols-2 gap-2">
        <UButton
          icon="i-lucide-bring-to-front"
          label="Adelante"
          color="neutral"
          variant="outline"
          size="sm"
          @click="bringForward"
        />
        <UButton
          icon="i-lucide-send-to-back"
          label="Atrás"
          color="neutral"
          variant="outline"
          size="sm"
          @click="sendBackward"
        />
      </div>

      <UButton
        block
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        label="Eliminar"
        @click="removeSelected"
      />
    </template>
  </section>
</template>
