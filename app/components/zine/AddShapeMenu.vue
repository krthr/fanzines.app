<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { SHAPE_KINDS, type ShapeKind } from '~/types/zine'

// "+ Shape": the trigger is the slot, so the top bar and the mobile bar keep their own
// button. The menu opens toward the canvas.
const props = defineProps<{ side?: 'top' | 'bottom' }>()
const emit = defineEmits<{ add: [kind: ShapeKind] }>()

const SHAPE_ICONS: Record<ShapeKind, string> = {
  rect: 'i-lucide-square',
  circle: 'i-lucide-circle',
  line: 'i-lucide-minus'
}

const { t } = useI18n()

const items = computed<DropdownMenuItem[]>(() => SHAPE_KINDS.map((kind) => ({
  label: t(`editor.shapes.${kind}`),
  icon: SHAPE_ICONS[kind],
  onSelect: () => emit('add', kind)
})))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ side: props.side ?? 'bottom', align: 'start', sideOffset: 8 }"
    :ui="{
      content: 'min-w-44 rounded-none ring-0 border-2 border-(--ink-dark) bg-(--paper) shadow-[4px_4px_0_var(--orange-deep)] font-(family-name:--font-body) data-[state=open]:animate-none data-[state=closed]:animate-none',
      group: 'p-1',
      item: 'gap-2.5 px-2.5 py-2 text-[14px] leading-[18px] font-semibold text-(--ink-dark) data-highlighted:text-(--ink-dark) before:rounded-none data-highlighted:before:bg-(--ink-dark)/10',
      itemLeadingIcon: 'size-4 text-(--ink-dark) group-data-highlighted:text-(--ink-dark)'
    }"
  >
    <slot />
  </UDropdownMenu>
</template>
