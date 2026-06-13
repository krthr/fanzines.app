<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { ImageElement, PageId, TextElement, ZineElement } from '~/types/zine'
import { PAGE_LABELS } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { IMPOSED_PAGE_IDS, IMPOSITION_SLOTS, PAGE_H, PAGE_W } from '~/utils/zineLayout'

const { state, selectPage } = useZineStore()

const slots = computed(() => IMPOSED_PAGE_IDS.map((pageId) => ({
  pageId,
  slot: IMPOSITION_SLOTS[pageId],
  elements: state.value.pageElementIds[pageId].map((id) => state.value.elements[id]).filter(Boolean)
})))

function slotStyle(pageId: PageId): CSSProperties {
  const slot = IMPOSITION_SLOTS[pageId]
  return {
    left: `${slot.col * 25}%`,
    top: `${slot.row * 50}%`,
    width: '25%',
    height: '50%'
  }
}

function contentStyle(pageId: PageId): CSSProperties {
  const slot = IMPOSITION_SLOTS[pageId]
  return {
    transform: slot.rotation === 180 ? 'rotate(180deg)' : 'none'
  }
}

function baseElementStyle(element: ZineElement): CSSProperties {
  return {
    left: `${(element.x / PAGE_W) * 100}%`,
    top: `${(element.y / PAGE_H) * 100}%`,
    width: `${(element.width / PAGE_W) * 100}%`,
    height: `${(element.height / PAGE_H) * 100}%`,
    transform: `rotate(${element.rotation}deg)`,
    opacity: `${element.opacity}`,
    transformOrigin: 'top left'
  }
}

function textStyle(element: TextElement): CSSProperties {
  return {
    ...baseElementStyle(element),
    color: element.fill,
    fontFamily: element.fontFamily,
    fontWeight: element.fontStyle === 'bold' ? '700' : '400',
    fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
    fontSize: `${Math.max(4, element.fontSize * 0.04)}px`,
    lineHeight: `${element.lineHeight}`,
    textAlign: element.align,
    overflow: 'hidden',
    wordBreak: 'break-word'
  }
}

function imageStyle(element: ImageElement): CSSProperties {
  return {
    ...baseElementStyle(element),
    display: 'block',
    maxWidth: 'none',
    maxHeight: 'none',
    objectFit: 'fill'
  }
}
</script>

<template>
  <div class="zine-sheet-preview">
    <button
      v-for="item in slots"
      :key="item.pageId"
      type="button"
      class="group absolute overflow-hidden border bg-white text-left transition"
      :class="[
        state.previewGuides ? 'border-[rgb(29_28_24_/_18%)]' : 'border-transparent',
        state.selectedPageId === item.pageId
          ? 'ring-2 ring-[var(--zine-accent)] ring-inset'
          : 'hover:ring-1 hover:ring-[var(--zine-accent)] hover:ring-inset'
      ]"
      :style="slotStyle(item.pageId)"
      @click="selectPage(item.pageId)"
    >
      <div class="absolute inset-0 overflow-hidden" :style="contentStyle(item.pageId)">
        <template v-for="element in item.elements" :key="element.id">
          <img
            v-if="element.type === 'image'"
            :src="element.src"
            alt=""
            class="absolute"
            :style="imageStyle(element)"
          >
          <div
            v-else
            class="absolute"
            :style="textStyle(element)"
          >
            {{ element.text }}
          </div>
        </template>
      </div>
      <span
        class="absolute left-1 top-1 z-[12] max-w-[calc(100%-0.5rem)] truncate rounded-[2px] bg-white/80 px-1 text-[9px] font-medium text-muted shadow-sm backdrop-blur-sm transition-opacity"
        :class="state.previewGuides || state.selectedPageId === item.pageId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'"
      >
        {{ item.slot.label === 'Portada' || item.slot.label === 'Contraportada' ? item.slot.label : `p. ${item.slot.label}` }}
      </span>
      <span class="sr-only">{{ PAGE_LABELS[item.pageId] }}</span>
    </button>

    <template v-if="state.previewGuides">
      <span class="zine-sheet-guide fold-v" style="left: 25%;" />
      <span class="zine-sheet-guide fold-v" style="left: 50%;" />
      <span class="zine-sheet-guide fold-v" style="left: 75%;" />
      <span class="zine-sheet-guide fold-h" style="left: 0; top: 50%; width: 25%;" />
      <span class="zine-sheet-guide fold-h" style="right: 0; top: 50%; width: 25%;" />
      <span class="zine-sheet-guide cut-h" />
    </template>
  </div>
</template>
