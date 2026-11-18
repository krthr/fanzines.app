<script setup lang="ts">
import { computed } from 'vue'
import { PAGE_IDS, type PageId } from '~/types/zine'
import { useZineDragState } from '~/composables/useZineDragState.client'
import { useZineEditorView } from '~/composables/useZineEditorView.client'

// Shown over the canvas while files are dragged across the editor. It only
// states the rule the import already follows: one image per page, from the
// start page onward, in reading order.
const { dragFileCount } = useZineDragState()
const { dropStartPageId, dropTargetPageIds } = useZineEditorView()

const READING_NAMES: Record<PageId, string> = {
  'front-cover': 'portada',
  p1: '1',
  p2: '2',
  p3: '3',
  p4: '4',
  p5: '5',
  p6: '6',
  'back-cover': 'contraportada'
}

const PLACE_NAMES: Record<PageId, string> = {
  'front-cover': 'la portada',
  p1: 'la página 1',
  p2: 'la página 2',
  p3: 'la página 3',
  p4: 'la página 4',
  p5: 'la página 5',
  p6: 'la página 6',
  'back-cover': 'la contraportada'
}

// null when the browser does not say how many files are being dragged.
const count = computed(() => dragFileCount.value)
const targets = computed(() => dropTargetPageIds.value)
const start = computed(() => PLACE_NAMES[dropStartPageId.value])
const available = computed(() => PAGE_IDS.length - PAGE_IDS.indexOf(dropStartPageId.value))

const title = computed(() => {
  if (count.value === null) return 'Suelta tus fotos'
  return count.value === 1 ? 'Suelta la foto' : `Suelta las ${count.value} fotos`
})

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
}

const rule = computed(() => {
  if (count.value === null) {
    return `Empiezan en ${start.value} y siguen en orden de lectura. La miniatura marca dónde empiezan.`
  }

  if (count.value === 1) {
    return `Va en ${start.value}. La miniatura te lo muestra.`
  }

  const order = joinNames(targets.value.map((pageId) => READING_NAMES[pageId]))

  if (count.value > available.value) {
    const fit = available.value === 1 ? 'Solo cabe 1' : `Solo caben ${available.value}`
    return `Empiezan en ${start.value} y siguen en orden: ${order}. ${fit}; el resto no se añade.`
  }

  return `Empiezan en ${start.value} y siguen en orden: ${order}. Las miniaturas te lo muestran.`
})

const hint = computed(() => count.value === 1
  ? 'Suéltala sobre otra miniatura para ponerla en esa página.'
  : 'Suéltalas sobre otra miniatura para empezar desde esa página.')

const diagramCount = computed(() => count.value === null ? 3 : Math.max(1, targets.value.length))
</script>

<template>
  <div class="drop" aria-hidden="true">
    <p class="drop-title">
      {{ title }}
    </p>

    <div class="drop-card">
      <div class="drop-diagram">
        <span v-for="index in diagramCount" :key="index" class="drop-mini" />
      </div>
      <p class="drop-rule-title">
        Una en cada página
      </p>
      <p class="drop-rule">
        {{ rule }}
      </p>
    </div>

    <p class="drop-hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.drop {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: rgb(11 10 9 / 96%);
  pointer-events: none;
}

.drop-title {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 30px;
  letter-spacing: 1px;
  line-height: 45px;
  text-align: center;
  text-transform: uppercase;
}

.drop-card {
  display: flex;
  width: min(420px, 100%);
  min-height: 270px;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 28px;
  background: var(--acid);
  box-shadow: 8px 8px 0 var(--orange);
  color: var(--ink-dark);
}

.drop-diagram {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.drop-mini {
  flex: 0 1 44px;
  aspect-ratio: 44 / 62;
  background: var(--ink-dark);
  box-shadow: inset 0 0 0 1.5px var(--ink-dark), inset 0 0 0 4px #fff;
}

.drop-rule-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  letter-spacing: 0.5px;
  line-height: 1;
  text-transform: uppercase;
}

.drop-rule {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
}

.drop-hint {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 16px;
  text-align: center;
}
</style>
