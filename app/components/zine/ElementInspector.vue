<script setup lang="ts">
import { computed } from 'vue'
import type { FontOption, ZineElement } from '~/types/zine'
import { FONT_OPTIONS } from '~/types/zine'
import { PAGE_H, PAGE_W } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'
import { useZinePageLabels } from '~/composables/useZinePageLabels'

type ImageElement = Extract<ZineElement, { type: 'image' }>
type HorizontalImageAlignment = 'left' | 'center' | 'right'
type VerticalImageAlignment = 'top' | 'middle' | 'bottom'

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
const { t } = useI18n()
const { pageLabel } = useZinePageLabels()
const { trackZineEvent } = useZineAnalytics()

const fontItems = FONT_OPTIONS.map((font) => ({ label: font, value: font }))
const styleItems = computed(() => [
  { label: t('inspector.styles.normal'), value: 'normal' },
  { label: t('inspector.styles.bold'), value: 'bold' },
  { label: t('inspector.styles.italic'), value: 'italic' }
])
const alignItems = computed(() => [
  { label: t('inspector.align.left'), value: 'left', icon: 'i-lucide-align-left' },
  { label: t('inspector.align.center'), value: 'center', icon: 'i-lucide-align-center' },
  { label: t('inspector.align.right'), value: 'right', icon: 'i-lucide-align-right' }
])
const imageHorizontalAlignItems = computed(() => [
  { label: t('inspector.align.leftShort'), value: 'left', icon: 'i-lucide-align-horizontal-justify-start' },
  { label: t('inspector.align.center'), value: 'center', icon: 'i-lucide-align-horizontal-justify-center' },
  { label: t('inspector.align.rightShort'), value: 'right', icon: 'i-lucide-align-horizontal-justify-end' }
] satisfies Array<{ label: string, value: HorizontalImageAlignment, icon: string }>)
const imageVerticalAlignItems = computed(() => [
  { label: t('inspector.align.top'), value: 'top', icon: 'i-lucide-align-vertical-justify-start' },
  { label: t('inspector.align.middle'), value: 'middle', icon: 'i-lucide-align-vertical-justify-center' },
  { label: t('inspector.align.bottom'), value: 'bottom', icon: 'i-lucide-align-vertical-justify-end' }
] satisfies Array<{ label: string, value: VerticalImageAlignment, icon: string }>)

const activePageLabel = computed(() => pageLabel(state.value.selectedPageId))

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

function imageX(element: ImageElement, alignment: HorizontalImageAlignment) {
  if (alignment === 'left') return 0
  if (alignment === 'center') return (PAGE_W - element.width) / 2
  return PAGE_W - element.width
}

function imageY(element: ImageElement, alignment: VerticalImageAlignment) {
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

function hasHorizontalImageMovement(element: ImageElement) {
  return imageHorizontalAlignItems.value.some((item) => !isAligned(element.x, imageX(element, item.value)))
}

function hasVerticalImageMovement(element: ImageElement) {
  return imageVerticalAlignItems.value.some((item) => !isAligned(element.y, imageY(element, item.value)))
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

function alignImageHorizontal(alignment: HorizontalImageAlignment) {
  const element = selectedElement.value
  if (!isImageElement(element) || !hasHorizontalImageMovement(element)) return

  updateElement(element.id, {
    x: imageX(element, alignment)
  })
}

function alignImageVertical(alignment: VerticalImageAlignment) {
  const element = selectedElement.value
  if (!isImageElement(element) || !hasVerticalImageMovement(element)) return

  updateElement(element.id, {
    y: imageY(element, alignment)
  })
}

function canAlignImageHorizontal() {
  const element = selectedElement.value
  return isImageElement(element) && hasHorizontalImageMovement(element)
}

function canAlignImageVertical() {
  const element = selectedElement.value
  return isImageElement(element) && hasVerticalImageMovement(element)
}

function isImageHorizontallyAligned(alignment: HorizontalImageAlignment) {
  const element = selectedElement.value
  return isImageElement(element)
    && hasHorizontalImageMovement(element)
    && isAligned(element.x, imageX(element, alignment))
}

function isImageVerticallyAligned(alignment: VerticalImageAlignment) {
  const element = selectedElement.value
  return isImageElement(element)
    && hasVerticalImageMovement(element)
    && isAligned(element.y, imageY(element, alignment))
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
        {{ t('inspector.title') }}
      </h2>
      <p class="mt-1 text-xs leading-5 text-muted">
        {{ selectedElement ? (selectedElement.type === 'image' ? t('inspector.imageSelected') : t('inspector.textSelected')) : activePageLabel }}
      </p>
    </div>

    <div v-if="!selectedElement" class="zine-empty-state p-4 text-sm leading-6">
      {{ t('inspector.empty') }}
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

        <UFormField :label="t('inspector.width')">
          <UInputNumber
            :model-value="Math.round(selectedElement.width)"
            :min="20"
            :max="PAGE_W * 2"
            :step="10"
            class="w-full"
            @update:model-value="(value) => patchNumber('width', value)"
          />
        </UFormField>

        <UFormField :label="t('inspector.height')">
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

      <UFormField :label="t('inspector.rotation')">
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

      <UFormField :label="t('inspector.opacity')">
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
        <UFormField :label="t('inspector.text')">
          <UTextarea
            :model-value="selectedElement.text"
            :rows="4"
            autoresize
            class="w-full"
            @update:model-value="(value) => patch({ text: String(value ?? '') })"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="t('inspector.font')">
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

          <UFormField :label="t('inspector.style')">
            <USelect
              :model-value="selectedElement.fontStyle"
              :items="styleItems"
              class="w-full"
              @update:model-value="(value) => patch({ fontStyle: value as 'normal' | 'bold' | 'italic' })"
            />
          </UFormField>

          <UFormField :label="t('inspector.size')">
            <UInputNumber
              :model-value="selectedElement.fontSize"
              :min="12"
              :max="220"
              :step="2"
              class="w-full"
              @update:model-value="(value) => patchNumber('fontSize', value)"
            />
          </UFormField>

          <UFormField :label="t('inspector.color')">
            <input
              class="zine-input-color"
              type="color"
              :value="selectedElement.fill"
              @input="(event) => patch({ fill: (event.target as HTMLInputElement).value })"
            >
          </UFormField>
        </div>

        <UFormField :label="t('inspector.alignment')">
          <div class="grid grid-cols-3 gap-2">
            <UButton
              v-for="item in alignItems"
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
      </template>

      <template v-else>
        <div class="zine-element-card p-3">
          <p class="truncate text-sm font-medium text-default">
            {{ selectedElement.fileName || t('inspector.imageFallback') }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ selectedElement.naturalWidth }} x {{ selectedElement.naturalHeight }} px
          </p>
        </div>

        <div class="space-y-3">
          <UButton
            block
            icon="i-lucide-expand"
            :label="t('inspector.fitPage')"
            color="primary"
            variant="solid"
            size="sm"
            @click="fillImagePage"
          />

          <UButton
            block
            icon="i-lucide-maximize"
            :label="t('inspector.fillPage')"
            color="secondary"
            variant="solid"
            size="sm"
            @click="coverImagePage"
          />

          <UFormField :label="t('inspector.alignHorizontal')">
            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="item in imageHorizontalAlignItems"
                :key="item.value"
                :icon="item.icon"
                :label="item.label"
                :color="isImageHorizontallyAligned(item.value) ? 'primary' : 'neutral'"
                :variant="isImageHorizontallyAligned(item.value) ? 'solid' : 'outline'"
                size="sm"
                block
                :disabled="!canAlignImageHorizontal()"
                @click="alignImageHorizontal(item.value)"
              />
            </div>
          </UFormField>

          <UFormField :label="t('inspector.alignVertical')">
            <div class="grid grid-cols-3 gap-2">
              <UButton
                v-for="item in imageVerticalAlignItems"
                :key="item.value"
                :icon="item.icon"
                :label="item.label"
                :color="isImageVerticallyAligned(item.value) ? 'primary' : 'neutral'"
                :variant="isImageVerticallyAligned(item.value) ? 'solid' : 'outline'"
                size="sm"
                block
                :disabled="!canAlignImageVertical()"
                @click="alignImageVertical(item.value)"
              />
            </div>
          </UFormField>
        </div>
      </template>

      <div class="grid grid-cols-2 gap-2">
        <UButton
          icon="i-lucide-bring-to-front"
          :label="t('inspector.bringForward')"
          color="neutral"
          variant="outline"
          size="sm"
          @click="bringForward"
        />
        <UButton
          icon="i-lucide-send-to-back"
          :label="t('inspector.sendBackward')"
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
        :label="t('inspector.delete')"
        @click="removeSelected"
      />
    </template>
  </section>
</template>
