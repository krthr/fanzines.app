<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PAGE_IDS, type PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZinePageLabels } from '~/composables/useZinePageLabels'
import { useZine3DTextures } from '~/composables/useZine3DTextures.client'
import { populateSampleZine } from '~/utils/zinePrototypeSample.client'
import ZineBooklet3D, {
  type BookletInteractionMode,
  type BookletPaperStyle,
  type BookletTelemetry
} from '~/components/zine/prototype/ZineBooklet3D.client.vue'
import ZineFold3D from '~/components/zine/prototype/ZineFold3D.client.vue'
import ZineToggle from '~/components/zine/ZineToggle.vue'

// PROTOTYPE — Variant A: "Canvas 3D Tab"
// Embeds a 3D booklet view directly inside the editor's Design view switch
// (`Page | Spread | 3D`), synced live with the real Pages sidebar and store.

const SPREAD_STOPS: ReadonlyArray<{ index: number; short: string; pages: PageId[] }> = [
  { index: 0, short: 'Cover', pages: ['front-cover'] },
  { index: 1, short: '1–2', pages: ['p1', 'p2'] },
  { index: 2, short: '3–4', pages: ['p3', 'p4'] },
  { index: 3, short: '5–6', pages: ['p5', 'p6'] },
  { index: 4, short: 'Back', pages: ['back-cover'] }
]

const props = defineProps<{
  isDesktop: boolean
}>()

const emit = defineEmits<{
  switchTo2D: [mode: 'page' | 'spread', pageId?: PageId]
}>()

const { state, selectPage } = useZineStore()
const { pageLabel } = useZinePageLabels()
const { textures, hasContent, filledCount, isRendering } = useZine3DTextures()

const bookletRef = ref<InstanceType<typeof ZineBooklet3D> | null>(null)
const spreadIndex = ref(pageIdToSpread(state.value.selectedPageId))
const interactionMode = ref<BookletInteractionMode>('swipe-first')
const paperStyle = ref<BookletPaperStyle>('matte')
const showFoldMarks = ref(true)
const showCutFoldMode = ref(false)
const foldProgress = ref(0)
const isPlayingFold = ref(false)
let foldRafId: number | null = null

function stopFoldPlayback() {
  if (foldRafId !== null) {
    window.cancelAnimationFrame(foldRafId)
    foldRafId = null
  }
  isPlayingFold.value = false
}

function playCutAndFold() {
  stopFoldPlayback()
  showCutFoldMode.value = true
  if (foldProgress.value >= 0.99) foldProgress.value = 0
  isPlayingFold.value = true

  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    foldProgress.value = Math.min(1, foldProgress.value + dt / 6.8)
    if (foldProgress.value >= 1) {
      foldRafId = null
      isPlayingFold.value = false
      return
    }
    foldRafId = window.requestAnimationFrame(step)
  }
  foldRafId = window.requestAnimationFrame(step)
}

function exitCutAndFold() {
  stopFoldPlayback()
  showCutFoldMode.value = false
}

onBeforeUnmount(stopFoldPlayback)

const telemetry = ref<BookletTelemetry>({
  progress: spreadIndex.value,
  spreadIndex: spreadIndex.value,
  rotX: 16,
  rotY: -18,
  zoom: 1,
  gesture: 'idle'
})

const pageLabels = computed(() =>
  PAGE_IDS.reduce((acc, id) => {
    acc[id] = pageLabel(id)
    return acc
  }, {} as Record<PageId, string>)
)

function pageIdToSpread(pageId: PageId): number {
  const match = SPREAD_STOPS.find((stop) => stop.pages.includes(pageId))
  return match ? match.index : 0
}

function spreadToPrimaryPage(index: number): PageId {
  return SPREAD_STOPS[index]?.pages[0] ?? 'front-cover'
}

// Keep 3D booklet synced when user clicks any page in the real Pages sidebar
watch(() => state.value.selectedPageId, (pageId) => {
  const target = pageIdToSpread(pageId)
  if (target !== spreadIndex.value) {
    spreadIndex.value = target
  }
})

function handleSpreadUpdate(next: number) {
  spreadIndex.value = next
  const targetPage = spreadToPrimaryPage(next)
  if (!SPREAD_STOPS[next]?.pages.includes(state.value.selectedPageId)) {
    selectPage(targetPage)
  }
}

const activeSpreadTitle = computed(() => {
  const stop = SPREAD_STOPS[spreadIndex.value] ?? SPREAD_STOPS[0]!
  return stop.pages.map((id) => pageLabel(id)).join(' · ')
})

const presets = [
  { id: 'desk', label: '3/4 Desk', rotX: 18, rotY: -22, zoom: 1 },
  { id: 'front', label: 'Straight', rotX: 0, rotY: 0, zoom: 1.05 },
  { id: 'top', label: 'Top-Down', rotX: 46, rotY: 0, zoom: 0.96 },
  { id: 'back', label: 'Back Cover', rotX: 12, rotY: 180, zoom: 1 }
] as const

function applyPreset(preset: typeof presets[number]) {
  bookletRef.value?.setPose(preset.rotX, preset.rotY, preset.zoom)
}

function editCurrentPage() {
  const pageId = spreadToPrimaryPage(spreadIndex.value)
  selectPage(pageId)
  emit('switchTo2D', spreadIndex.value === 0 || spreadIndex.value === 4 ? 'page' : 'spread', pageId)
}
</script>

<template>
  <section class="canvas-area proto-a-canvas" aria-label="3D Zine Canvas">
    <!-- Canvas header mirrors the real editor header with the added 3D tab -->
    <div class="canvas-head">
      <div class="page-nav">
        <button
          type="button"
          class="nav-arrow"
          :disabled="spreadIndex <= 0"
          aria-label="Previous spread"
          @click="handleSpreadUpdate(Math.max(0, spreadIndex - 1))"
        >
          <UIcon name="i-lucide-chevron-left" aria-hidden="true" />
        </button>

        <div class="page-title">
          <h2>{{ activeSpreadTitle }}</h2>
          <p>3D preview · {{ filledCount }} of 8 pages · {{ isRendering ? 'updating…' : 'live' }}</p>
        </div>

        <button
          type="button"
          class="nav-arrow"
          :disabled="spreadIndex >= 4"
          aria-label="Next spread"
          @click="handleSpreadUpdate(Math.min(4, spreadIndex + 1))"
        >
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div class="view-controls">
        <!-- Gesture toggle: Swipe pages vs Free Orbit -->
        <div class="ed-segment is-fit" role="group" aria-label="3D drag gesture">
          <button
            type="button"
            class="ed-segment-item"
            :class="{ 'is-active': interactionMode === 'swipe-first' }"
            @click="interactionMode = 'swipe-first'"
          >
            <UIcon name="i-lucide-hand" aria-hidden="true" />
            <span class="view-label">Swipe</span>
          </button>
          <button
            type="button"
            class="ed-segment-item"
            :class="{ 'is-active': interactionMode === 'orbit-first' }"
            @click="interactionMode = 'orbit-first'"
          >
            <UIcon name="i-lucide-rotate-3d" aria-hidden="true" />
            <span class="view-label">Orbit</span>
          </button>
        </div>

        <!-- Existing Page | Spread | + new 3D tab -->
        <div class="ed-segment is-fit" role="group" aria-label="Canvas view">
          <button
            type="button"
            class="ed-segment-item"
            @click="emit('switchTo2D', 'page')"
          >
            <UIcon name="i-lucide-file" aria-hidden="true" />
            <span class="view-label">Page</span>
          </button>
          <button
            v-if="isDesktop"
            type="button"
            class="ed-segment-item"
            @click="emit('switchTo2D', 'spread')"
          >
            <UIcon name="i-lucide-book-open" aria-hidden="true" />
            <span class="view-label">Spread</span>
          </button>
          <button
            type="button"
            class="ed-segment-item is-active"
            aria-pressed="true"
          >
            <UIcon name="i-lucide-box" aria-hidden="true" />
            <span class="view-label">3D</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main 3D desk stage -->
    <div class="stage-3d">
      <!-- Subtle print-shop desk registration marks -->
      <span class="reg tl" aria-hidden="true" />
      <span class="reg tr" aria-hidden="true" />
      <span class="reg bl" aria-hidden="true" />
      <span class="reg br" aria-hidden="true" />

      <ZineFold3D
        v-if="showCutFoldMode"
        :textures="textures"
        :has-content="hasContent"
        :page-labels="pageLabels"
        :fold="foldProgress"
      />

      <ZineBooklet3D
        v-else
        ref="bookletRef"
        :textures="textures"
        :has-content="hasContent"
        :page-labels="pageLabels"
        :spread="spreadIndex"
        :interaction-mode="interactionMode"
        :paper-style="paperStyle"
        :show-fold-marks="showFoldMarks"
        :initial-rot-x="16"
        :initial-rot-y="-18"
        @update:spread="handleSpreadUpdate"
        @telemetry="telemetry = $event"
      />

      <!-- Empty state callout floating unobtrusively at top -->
      <div v-if="filledCount === 0 && !showCutFoldMode" class="empty-banner">
        <span>Your zine is blank. Load a sample to test 3D flipping, or add pages in 2D.</span>
        <button type="button" class="sample-btn" @click="populateSampleZine">
          <UIcon name="i-lucide-sparkles" aria-hidden="true" />
          Fill 8-page sample
        </button>
      </div>

      <!-- Bottom Cut & Fold scrub dock OR Spread jump bar -->
      <div v-if="showCutFoldMode" class="fold-mini-dock">
        <button type="button" class="dock-pill is-active" @click="isPlayingFold ? stopFoldPlayback() : playCutAndFold()">
          {{ isPlayingFold ? 'Pause' : foldProgress >= 0.99 ? 'Replay' : 'Play' }}
        </button>
        <input
          :value="foldProgress"
          type="range"
          min="0"
          max="1"
          step="0.002"
          class="mini-range"
          aria-label="Cut and fold progress"
          @input="stopFoldPlayback(); foldProgress = Number(($event.target as HTMLInputElement).value)"
        >
        <button type="button" class="dock-pill" @click="exitCutAndFold">
          Back to flip
        </button>
      </div>

      <div v-else class="spread-dock" role="tablist" aria-label="Zine spreads">
        <button
          v-for="stop in SPREAD_STOPS"
          :key="stop.index"
          type="button"
          class="dock-pill"
          :class="{ 'is-active': spreadIndex === stop.index }"
          @click="handleSpreadUpdate(stop.index)"
        >
          {{ stop.short }}
        </button>
      </div>
    </div>

    <!-- Bottom hint strip matching the editor's reserved 41px hint row -->
    <div v-if="isDesktop" class="hints">
      <p class="hint">
        <kbd class="ed-key">Drag page</kbd>
        {{ interactionMode === 'swipe-first' ? 'swipe to turn leaf' : 'orbit 360°' }}
      </p>
      <p class="hint">
        <kbd class="ed-key">{{ interactionMode === 'swipe-first' ? 'Drag desk / Shift' : 'Scroll' }}</kbd>
        {{ interactionMode === 'swipe-first' ? 'rotate 360°' : 'zoom in/out' }}
      </p>
      <p class="hint">
        <kbd class="ed-key">Double-click</kbd>
        reset angle
      </p>
    </div>
  </section>

  <!-- Right Cream Inspector: 3D Studio Controls & Live State -->
  <aside v-if="isDesktop" class="inspector ed-light ed-scroll proto-a-inspector">
    <div class="insp-block">
      <h2 class="ed-display">3D View</h2>
      <p class="insp-copy">
        Swipe horizontally across the pages to flip leaves, or drag the dark desk around the zine to inspect it from every angle.
      </p>

      <div class="telemetry-grid">
        <div class="tele-cell">
          <span class="tele-k">SPREAD</span>
          <strong class="tele-v">{{ telemetry.spreadIndex + 1 }} / 5</strong>
        </div>
        <div class="tele-cell">
          <span class="tele-k">YAW</span>
          <strong class="tele-v">{{ Math.round(telemetry.rotY) }}°</strong>
        </div>
        <div class="tele-cell">
          <span class="tele-k">PITCH</span>
          <strong class="tele-v">{{ Math.round(telemetry.rotX) }}°</strong>
        </div>
        <div class="tele-cell">
          <span class="tele-k">GESTURE</span>
          <strong class="tele-v">{{ telemetry.gesture }}</strong>
        </div>
      </div>
    </div>

    <hr class="insp-hr">

    <div class="insp-block">
      <h3 class="insp-sub">Camera angles</h3>
      <div class="preset-grid">
        <button
          v-for="preset in presets"
          :key="preset.id"
          type="button"
          class="ed-btn-line"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <hr class="insp-hr">

    <div class="insp-block">
      <h3 class="insp-sub">Paper & creases</h3>
      <div class="paper-row">
        <button
          v-for="style in (['clean', 'matte', 'newsprint'] as const)"
          :key="style"
          type="button"
          class="ed-btn-line"
          :class="{ 'is-selected': paperStyle === style }"
          @click="paperStyle = style"
        >
          {{ style }}
        </button>
      </div>
      <ZineToggle v-model="showFoldMarks">
        Spine & crease shading
      </ZineToggle>
    </div>

    <hr class="insp-hr">

    <div class="insp-block">
      <button
        type="button"
        class="ed-btn-line is-full"
        @click="showCutFoldMode ? exitCutAndFold() : playCutAndFold()"
      >
        <UIcon :name="showCutFoldMode ? 'i-lucide-book-open' : 'i-lucide-scissors'" aria-hidden="true" />
        {{ showCutFoldMode ? 'Back to swipeable 3D zine' : 'Animate cut & fold' }}
      </button>
      <button type="button" class="ed-btn-line is-full" @click="editCurrentPage">
        <UIcon name="i-lucide-pencil" aria-hidden="true" />
        Edit {{ pageLabel(spreadToPrimaryPage(spreadIndex)) }} in 2D
      </button>
      <button type="button" class="ed-btn-line is-full" @click="populateSampleZine">
        <UIcon name="i-lucide-sparkles" aria-hidden="true" />
        {{ filledCount > 0 ? 'Reload 8-page sample' : 'Fill 8-page sample' }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.proto-a-canvas {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--ed-canvas);
  container-type: inline-size;
}

.canvas-head {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 68px;
  padding: 0 24px;
}

.page-nav {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.nav-arrow {
  display: grid;
  flex: none;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
}

.nav-arrow:hover:not(:disabled) {
  border-color: var(--ink);
}

.nav-arrow:disabled {
  color: var(--ed-dim);
}

.page-title h2 {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
}

.page-title p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 16px;
}

.view-controls {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
}

.ed-segment.is-fit .ed-segment-item {
  flex: none;
  padding: 7px 10px;
}

.stage-3d {
  position: relative;
  min-height: 0;
  flex: 1;
  margin: 0 20px;
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 50% 44%, #1e1a17 0%, #100e0d 72%);
}

.reg {
  position: absolute;
  width: 14px;
  height: 14px;
  border-color: rgb(237 231 218 / 18%);
  border-style: solid;
  pointer-events: none;
}

.reg.tl { top: 10px; left: 10px; border-width: 1px 0 0 1px; }
.reg.tr { top: 10px; right: 10px; border-width: 1px 1px 0 0; }
.reg.bl { bottom: 10px; left: 10px; border-width: 0 0 1px 1px; }
.reg.br { bottom: 10px; right: 10px; border-width: 0 1px 1px 0; }

.empty-banner {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--orange);
  background: rgb(11 10 9 / 92%);
  box-shadow: 4px 4px 0 var(--orange-deep);
  color: var(--ink);
  font-size: 12px;
  transform: translateX(-50%);
  white-space: nowrap;
}

.sample-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 0;
  background: var(--acid);
  color: var(--ink-dark);
  font-size: 12px;
  font-weight: 700;
}

.spread-dock,
.fold-mini-dock {
  position: absolute;
  bottom: 16px;
  left: 50%;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--line);
  background: rgb(11 10 9 / 90%);
  transform: translateX(-50%);
}

.fold-mini-dock {
  width: min(460px, calc(100% - 32px));
  padding: 6px 8px;
}

.mini-range {
  flex: 1;
  min-width: 120px;
  accent-color: var(--acid);
  cursor: pointer;
}

.dock-pill {
  padding: 6px 12px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-family: var(--font-type);
  font-size: 12px;
  transition: background 150ms ease, color 150ms ease;
}

.dock-pill:hover {
  color: var(--ink);
}

.dock-pill.is-active {
  background: var(--acid);
  color: var(--ink-dark);
  font-weight: 700;
}

.hints {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 24px;
  height: 41px;
  padding: 0 24px;
}

.hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.proto-a-inspector {
  flex: none;
  width: 320px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.insp-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.insp-copy {
  margin: 0;
  color: var(--text-dark);
  font-size: 13px;
  line-height: 1.45;
}

.insp-sub {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-dark);
}

.insp-hr {
  height: 1px;
  margin: 0;
  border: 0;
  background: rgb(11 10 9 / 15%);
}

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.tele-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--ed-hairline);
  background: #fff;
}

.tele-k {
  font-family: var(--font-type);
  font-size: 10px;
  color: var(--ed-label);
}

.tele-v {
  font-family: var(--font-type);
  font-size: 14px;
  color: var(--ink-dark);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.paper-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.paper-row .ed-btn-line {
  text-transform: capitalize;
  padding: 8px 6px;
}

.paper-row .ed-btn-line.is-selected {
  background: var(--ink-dark);
  color: var(--acid);
}

.is-full {
  width: 100%;
}

@container (max-width: 620px) {
  .view-label {
    display: none;
  }
}
</style>
