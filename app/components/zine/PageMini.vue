<script setup lang="ts">
import { computed } from 'vue'
import type { PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import ZinePageRender from '~/components/zine/ZinePageRender.vue'

// The miniature of one page. The parent owns the button, the label and the size.
const props = defineProps<{
  pageId: PageId
  width: number
  active?: boolean
  // This page receives a photo if the files being dragged are dropped now.
  dropTarget?: boolean
  // Spell out "vacía" / "+ foto" on empty pages (the mobile strip is too small).
  captions?: boolean
}>()

const { t } = useI18n()
const { state } = useZineStore()
const isEmpty = computed(() => state.value.pageElementIds[props.pageId].length === 0)
</script>

<template>
  <span
    class="mini"
    :class="{
      'is-empty': isEmpty,
      'is-active': active,
      'is-target': dropTarget
    }"
  >
    <ZinePageRender v-if="!isEmpty" :page-id="pageId" :width="width" />
    <span v-else-if="captions" class="mini-caption">{{ dropTarget ? t('editor.sidebar.addPhoto') : t('editor.sidebar.empty') }}</span>
  </span>
</template>

<style scoped>
.mini {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  background: #fff;
}

.mini.is-empty {
  background: var(--ink);
}

.mini.is-empty:not(.is-active, .is-target) {
  opacity: var(--mini-empty-opacity, 0.35);
}

.mini.is-empty.is-target {
  background: var(--ed-raised);
}

.mini-caption {
  color: var(--ed-faint);
  font-family: var(--font-type);
  font-size: 13px;
  line-height: 13px;
}

.mini.is-target .mini-caption {
  color: var(--acid);
}

/* Inner stroke, drawn over the render. */
.mini.is-active::after,
.mini.is-target::after {
  position: absolute;
  inset: 0;
  border: 2px solid var(--acid);
  content: "";
  pointer-events: none;
}

.mini.is-active::after {
  border-width: 3px;
}
</style>
