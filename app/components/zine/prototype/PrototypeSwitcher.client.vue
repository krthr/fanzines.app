<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from '#imports'

// PROTOTYPE: Floating bottom-centre switcher for the 3D fanzine UI prototype.
// Hidden in production builds; cycles `?variant=` via arrows and ← / → keys.

export type PrototypeVariantKey = 'A' | 'B' | 'C'

type PrototypeVariantDef = {
  key: PrototypeVariantKey
  name: string
}

const PROTOTYPE_VARIANTS: readonly PrototypeVariantDef[] = [
  { key: 'A', name: 'Canvas 3D Tab' },
  { key: 'B', name: 'Review & Fold Theater' },
  { key: 'C', name: 'Tactile 3D Reader' }
] as const

const props = defineProps<{
  current: PrototypeVariantKey | null
  empty: boolean
}>()

const emit = defineEmits<{
  loadSample: []
}>()

const isDev = import.meta.dev
const route = useRoute()
const router = useRouter()

const currentIndex = computed(() =>
  PROTOTYPE_VARIANTS.findIndex((item) => item.key === props.current)
)

const currentVariant = computed(() =>
  currentIndex.value >= 0 ? PROTOTYPE_VARIANTS[currentIndex.value] : null
)

function setVariant(key: PrototypeVariantKey | null) {
  const nextQuery = { ...route.query }
  if (key) {
    nextQuery.variant = key
  } else {
    delete nextQuery.variant
  }

  void router.replace({ query: nextQuery })
}

function step(delta: -1 | 1) {
  const total = PROTOTYPE_VARIANTS.length
  const base = currentIndex.value >= 0 ? currentIndex.value : 0
  const next = PROTOTYPE_VARIANTS[(base + delta + total) % total]!
  setVariant(next.key)
}

function handleKeydown(event: KeyboardEvent) {
  if (!isDev || !props.current) return
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) return

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <aside
    v-if="isDev"
    class="proto-bar"
    :class="{ 'is-idle': !currentVariant }"
    aria-label="3D Zine Prototype Switcher"
  >
    <template v-if="currentVariant">
      <button
        type="button"
        class="proto-arrow"
        title="Previous variant (←)"
        aria-label="Previous variant"
        @click="step(-1)"
      >
        <UIcon name="i-lucide-chevron-left" aria-hidden="true" />
      </button>

      <div class="proto-label">
        <span class="proto-badge">PROTOTYPE</span>
        <strong class="proto-name">{{ currentVariant.key }} ({{ currentVariant.name }})</strong>
      </div>

      <button
        type="button"
        class="proto-arrow"
        title="Next variant (→)"
        aria-label="Next variant"
        @click="step(1)"
      >
        <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
      </button>

      <span class="proto-sep" aria-hidden="true" />

      <button
        v-if="empty"
        type="button"
        class="proto-action is-accent"
        @click="emit('loadSample')"
      >
        <UIcon name="i-lucide-sparkles" aria-hidden="true" />
        Fill sample
      </button>

      <button
        type="button"
        class="proto-action"
        title="Exit prototype and return to standard editor"
        @click="setVariant(null)"
      >
        Exit
      </button>
    </template>

    <button
      v-else
      type="button"
      class="proto-launch"
      @click="setVariant('A')"
    >
      <span class="proto-badge">PROTOTYPE</span>
      <span>Test 3D Zine (A / B / C)</span>
      <UIcon name="i-lucide-box" aria-hidden="true" />
    </button>
  </aside>
</template>

<style scoped>
.proto-bar {
  position: fixed;
  bottom: 14px;
  left: 50%;
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: 2px solid var(--acid);
  background: #141210;
  box-shadow: 0 10px 28px rgb(0 0 0 / 55%), 4px 4px 0 var(--acid);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 12px;
  line-height: 1;
  transform: translateX(-50%);
  user-select: none;
}

.proto-bar.is-idle {
  bottom: 10px;
  padding: 0;
  border-color: var(--line);
  box-shadow: 0 6px 18px rgb(0 0 0 / 45%);
}

.proto-launch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 11px;
  border: 0;
  background: transparent;
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.proto-launch:hover {
  color: var(--acid);
}

.proto-launch .iconify {
  width: 14px;
  height: 14px;
  color: var(--acid);
}

.proto-arrow {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.proto-arrow:hover {
  border-color: var(--acid);
  color: var(--acid);
}

.proto-arrow .iconify {
  width: 15px;
  height: 15px;
}

.proto-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px;
  white-space: nowrap;
}

.proto-badge {
  padding: 2px 5px;
  background: var(--acid);
  color: var(--ink-dark);
  font-family: var(--font-type);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.proto-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}

.proto-sep {
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background: var(--line);
}

.proto-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.proto-action:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.proto-action.is-accent {
  border-color: var(--orange);
  background: var(--orange);
  color: var(--ink-dark);
  font-weight: 700;
}

.proto-action.is-accent:hover {
  filter: brightness(1.06);
}

.proto-action .iconify {
  width: 13px;
  height: 13px;
}

@media (max-width: 640px) {
  .proto-bar {
    bottom: 8px;
    max-width: calc(100vw - 16px);
    padding: 4px 6px;
  }

  .proto-badge {
    display: none;
  }
}
</style>
