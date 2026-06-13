<script setup lang="ts">
import { computed } from 'vue'
import type { FontOption, ZineElement } from '~/types/zine'
import { FONT_OPTIONS, PAGE_LABELS } from '~/types/zine'
import { PAGE_H, PAGE_W } from '~/utils/zineLayout'
import { useZineStore } from '~/composables/useZineStore'

const {
  state,
  selectedElement,
  updateElement,
  deleteElement,
  moveElementForward,
  moveElementBackward
} = useZineStore()

const fontItems = FONT_OPTIONS.map((font) => ({ label: font, value: font }))
const styleItems = [
  { label: 'Normal', value: 'normal' },
  { label: 'Negrita', value: 'bold' },
  { label: 'Cursiva', value: 'italic' }
]
const alignItems = [
  { label: 'Izquierda', value: 'left', icon: 'i-lucide-align-left' },
  { label: 'Centro', value: 'center', icon: 'i-lucide-align-center' },
  { label: 'Derecha', value: 'right', icon: 'i-lucide-align-right' }
]

const activePageLabel = computed(() => PAGE_LABELS[state.value.selectedPageId])

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

function removeSelected() {
  if (!selectedElement.value) return
  deleteElement(selectedElement.value.id)
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
  <section class="space-y-5">
    <div>
      <h2 class="text-sm font-semibold text-default">
        Propiedades
      </h2>
      <p class="mt-1 text-xs leading-5 text-muted">
        {{ selectedElement ? (selectedElement.type === 'image' ? 'Imagen seleccionada' : 'Texto seleccionado') : activePageLabel }}
      </p>
    </div>

    <div v-if="!selectedElement" class="rounded-lg border border-dashed border-muted bg-default/55 p-4 text-sm leading-6 text-muted">
      Selecciona un elemento del panel para editarlo.
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
        <UFormField label="Texto">
          <UTextarea
            :model-value="selectedElement.text"
            :rows="4"
            autoresize
            class="w-full"
            @update:model-value="(value) => patch({ text: String(value ?? '') })"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Fuente">
            <USelect
              :model-value="selectedElement.fontFamily"
              :items="fontItems"
              class="w-full"
              @update:model-value="(value) => patch({ fontFamily: value as FontOption } as Partial<ZineElement>)"
            />
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

        <UFormField label="Alineación">
          <div class="grid grid-cols-3 gap-2">
            <UButton
              v-for="item in alignItems"
              :key="item.value"
              :icon="item.icon"
              :label="item.label"
              :variant="selectedElement.align === item.value ? 'solid' : 'outline'"
              size="sm"
              block
              @click="patch({ align: item.value as 'left' | 'center' | 'right' })"
            />
          </div>
        </UFormField>
      </template>

      <template v-else>
        <div class="rounded-lg border border-muted bg-default/55 p-3">
          <p class="truncate text-sm font-medium text-default">
            {{ selectedElement.fileName || 'Imagen' }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ selectedElement.naturalWidth }} x {{ selectedElement.naturalHeight }} px
          </p>
        </div>
      </template>

      <div class="grid grid-cols-2 gap-2">
        <UButton
          icon="i-lucide-bring-to-front"
          label="Adelante"
          variant="outline"
          size="sm"
          @click="bringForward"
        />
        <UButton
          icon="i-lucide-send-to-back"
          label="Atrás"
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
