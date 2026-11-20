<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PAGE_IDS, type PageId } from '~/types/zine'
import { useZinePageLabels } from '~/composables/useZinePageLabels'
import { useZine3DTextures } from '~/composables/useZine3DTextures.client'
import { populateSampleZine } from '~/utils/zinePrototypeSample.client'
import ReviewPanel from '~/components/zine/ReviewPanel.vue'
import SheetPreview from '~/components/zine/SheetPreview.vue'
import ZineBooklet3D, { type BookletTelemetry } from '~/components/zine/prototype/ZineBooklet3D.client.vue'
import ZineFold3D from '~/components/zine/prototype/ZineFold3D.client.vue'

// PROTOTYPE — Variant B: "Review & Cut/Fold Theater"
// Places 3D inspection in the Review-before-print flow with 3 modes:
//   1) Cut & Fold (4-step 3D animated scissors cut + lengthwise fold + diamond cross + booklet)
//   2) 3D Zine (free 360° trackball orbit + filmstrip page scrubber)
//   3) Flat Sheet (the real imposed A4 sheet review)

type TheaterMode = 'fold' | 'booklet' | 'sheet'

const SPREAD_STOPS = [
  { index: 0, label: 'Cover' },
  { index: 1, label: '1–2' },
  { index: 2, label: '3–4' },
  { index: 3, label: '5–6' },
  { index: 4, label: 'Back' }
] as const

const FOLD_STEPS = [
  { label: 'Flat A4', value: 0 },
  { label: '1. Cut', value: 0.22 },
  { label: '2. Half', value: 0.46 },
  { label: '3. Cross', value: 0.74 },
  { label: '4. Zine', value: 1 }
] as const

defineProps<{
  isDesktop: boolean
}>()

const emit = defineEmits<{
  backToDesign: []
}>()

const { pageLabel } = useZinePageLabels()
const { textures, hasContent, filledCount } = useZine3DTextures()

const theaterMode = ref<TheaterMode>('fold')
const bookletRef = ref<InstanceType<typeof ZineBooklet3D> | null>(null)
const foldRef = ref<InstanceType<typeof ZineFold3D> | null>(null)
const spreadIndex = ref(0)
const foldAmount = ref(0)
const isAutoFolding = ref(false)
const isSpinning = ref(false)
const loopFold = ref(false)

let foldRafId: number | null = null
let spinRafId: number | null = null
let spinAngle = -20

const telemetry = ref<BookletTelemetry>({
  progress: 0,
  spreadIndex: 0,
  rotX: 18,
  rotY: -20,
  zoom: 1,
  gesture: 'idle'
})

const pageLabels = computed(() =>
  PAGE_IDS.reduce((acc, id) => {
    acc[id] = pageLabel(id)
    return acc
  }, {} as Record<PageId, string>)
)

function stopFoldAnim() {
  if (foldRafId !== null) {
    window.cancelAnimationFrame(foldRafId)
    foldRafId = null
  }
  isAutoFolding.value = false
}

function stopSpinAnim() {
  if (spinRafId !== null) {
    window.cancelAnimationFrame(spinRafId)
    spinRafId = null
  }
  isSpinning.value = false
}

function stopTimers() {
  stopFoldAnim()
  stopSpinAnim()
}

// Smoothly tween foldAmount to a specific target stop (e.g. clicking a step pill)
function animateFoldTo(target: number, durationMs = 700) {
  stopFoldAnim()
  const start = foldAmount.value
  const delta = target - start
  if (Math.abs(delta) < 0.002) {
    foldAmount.value = target
    return
  }

  const startTime = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / durationMs)
    const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2
    foldAmount.value = start + delta * eased
    if (t < 1) {
      foldRafId = window.requestAnimationFrame(step)
    } else {
      foldAmount.value = target
      foldRafId = null
    }
  }
  foldRafId = window.requestAnimationFrame(step)
}

// Play the full 4-step Cut & Fold sequence with gentle pacing (pauses slightly at key beats)
function startFullFoldPlay(restartIfDone = true) {
  stopFoldAnim()
  if (restartIfDone && foldAmount.value >= 0.99) {
    foldAmount.value = 0
  }

  isAutoFolding.value = true
  let last = performance.now()
  const TOTAL_SECONDS = 7.2

  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    // Slightly slower during the scissors cut and diamond cross so each beat reads clearly
    const speedFactor = foldAmount.value < 0.23 ? 0.85 : foldAmount.value > 0.45 && foldAmount.value < 0.76 ? 0.88 : 1.05
    foldAmount.value = Math.min(1, foldAmount.value + (dt / TOTAL_SECONDS) * speedFactor)

    if (foldAmount.value >= 1) {
      if (loopFold.value) {
        foldAmount.value = 0
        foldRafId = window.requestAnimationFrame(step)
      } else {
        foldRafId = null
        isAutoFolding.value = false
      }
      return
    }

    foldRafId = window.requestAnimationFrame(step)
  }

  foldRafId = window.requestAnimationFrame(step)
}

function toggleAutoFold() {
  if (isAutoFolding.value) {
    stopFoldAnim()
  } else {
    startFullFoldPlay(true)
  }
}

function toggleTurntable() {
  if (isSpinning.value) {
    stopSpinAnim()
    return
  }

  isSpinning.value = true
  spinAngle = telemetry.value.rotY
  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    spinAngle += dt * 36
    bookletRef.value?.setPose(16, spinAngle, telemetry.value.zoom)
    spinRafId = window.requestAnimationFrame(step)
  }
  spinRafId = window.requestAnimationFrame(step)
}

function setMode(next: TheaterMode) {
  stopTimers()
  theaterMode.value = next
}

function onScrubSpread(event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  spreadIndex.value = Math.round(val)
  bookletRef.value?.goToSpread(spreadIndex.value)
}

function onManualFoldScrub(event: Event) {
  stopFoldAnim()
  foldAmount.value = Number((event.target as HTMLInputElement).value)
}

function isStepActive(index: number) {
  const cur = FOLD_STEPS[index]!.value
  const next = FOLD_STEPS[index + 1]?.value ?? 1.1
  if (index === 0) return foldAmount.value < 0.05
  if (index === FOLD_STEPS.length - 1) return foldAmount.value >= 0.96
  return foldAmount.value >= cur - 0.08 && foldAmount.value < next - 0.08
}

// Auto-play the cut & fold animation once on entering Variant B so it comes alive immediately!
onMounted(() => {
  foldAmount.value = 0
  startFullFoldPlay(false)
})

onBeforeUnmount(stopTimers)
</script>

<template>
  <section class="canvas-area proto-b-theater" aria-label="Review and 3D Cut and Fold Theater">
    <!-- Theater header with 3-way view switch -->
    <div class="theater-head">
      <div class="theater-title">
        <h2>Inspect before you print</h2>
        <p>A4 landscape · 8 panels · drag anywhere to rotate 360°</p>
      </div>

      <div class="ed-segment is-fit" role="tablist" aria-label="Review inspection mode">
        <button
          type="button"
          class="ed-segment-item"
          :class="{ 'is-active': theaterMode === 'fold' }"
          @click="setMode('fold')"
        >
          <UIcon name="i-lucide-origami" aria-hidden="true" />
          <span>Cut &amp; Fold</span>
        </button>
        <button
          type="button"
          class="ed-segment-item"
          :class="{ 'is-active': theaterMode === 'booklet' }"
          @click="setMode('booklet')"
        >
          <UIcon name="i-lucide-book-open" aria-hidden="true" />
          <span>3D Zine</span>
        </button>
        <button
          type="button"
          class="ed-segment-item"
          :class="{ 'is-active': theaterMode === 'sheet' }"
          @click="setMode('sheet')"
        >
          <UIcon name="i-lucide-grid-2x2" aria-hidden="true" />
          <span>Flat Sheet</span>
        </button>
      </div>
    </div>

    <!-- Stage viewport -->
    <div class="theater-stage">
      <!-- Mode 1: Animated 4-step Cut & Fold 3D Simulator -->
      <template v-if="theaterMode === 'fold'">
        <ZineFold3D
          ref="foldRef"
          :textures="textures"
          :has-content="hasContent"
          :page-labels="pageLabels"
          :fold="foldAmount"
        />

        <!-- One-click handoff to swipe through the folded booklet once animation completes -->
        <button
          v-if="foldAmount >= 0.98 && !isAutoFolding"
          type="button"
          class="handoff-cta"
          @click="setMode('booklet')"
        >
          <UIcon name="i-lucide-book-open" aria-hidden="true" />
          Open &amp; swipe 3D zine →
        </button>

        <div class="fold-deck">
          <button type="button" class="play-btn" @click="toggleAutoFold">
            <UIcon :name="isAutoFolding ? 'i-lucide-pause' : foldAmount >= 0.99 ? 'i-lucide-rotate-ccw' : 'i-lucide-play'" aria-hidden="true" />
            {{ isAutoFolding ? 'Pause' : foldAmount >= 0.99 ? 'Replay' : 'Play' }}
          </button>

          <div class="fold-slider-wrap">
            <div class="fold-steps">
              <button
                v-for="(step, idx) in FOLD_STEPS"
                :key="step.label"
                type="button"
                :class="{ 'is-on': isStepActive(idx) }"
                @click="animateFoldTo(step.value)"
              >
                {{ step.label }}
              </button>
            </div>
            <input
              :value="foldAmount"
              type="range"
              min="0"
              max="1"
              step="0.002"
              class="scrubber-range"
              aria-label="Cut and fold animation progress"
              @input="onManualFoldScrub"
            >
          </div>

          <button
            type="button"
            class="loop-btn"
            :class="{ 'is-on': loopFold }"
            title="Loop cut and fold animation"
            @click="loopFold = !loopFold"
          >
            <UIcon name="i-lucide-repeat" aria-hidden="true" />
          </button>

          <span class="fold-pct">{{ Math.round(foldAmount * 100) }}%</span>
        </div>
      </template>

      <!-- Mode 2: Free 360° Orbit 3D Booklet -->
      <template v-else-if="theaterMode === 'booklet'">
        <ZineBooklet3D
          ref="bookletRef"
          :textures="textures"
          :has-content="hasContent"
          :page-labels="pageLabels"
          :spread="spreadIndex"
          interaction-mode="orbit-first"
          paper-style="matte"
          :initial-rot-x="18"
          :initial-rot-y="-20"
          @update:spread="spreadIndex = $event"
          @telemetry="telemetry = $event"
        />

        <!-- Bottom Filmstrip Page Scrubber -->
        <div class="scrubber-deck">
          <button
            type="button"
            class="deck-arrow"
            :disabled="spreadIndex <= 0"
            aria-label="Previous spread"
            @click="spreadIndex = Math.max(0, spreadIndex - 1)"
          >
            <UIcon name="i-lucide-chevron-left" aria-hidden="true" />
          </button>

          <div class="scrubber-mid">
            <div class="scrubber-stops">
              <button
                v-for="stop in SPREAD_STOPS"
                :key="stop.index"
                type="button"
                class="stop-btn"
                :class="{ 'is-active': spreadIndex === stop.index }"
                @click="spreadIndex = stop.index"
              >
                {{ stop.label }}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              :value="spreadIndex"
              class="scrubber-range"
              aria-label="Flip zine pages"
              @input="onScrubSpread"
            >
          </div>

          <button
            type="button"
            class="deck-arrow"
            :disabled="spreadIndex >= 4"
            aria-label="Next spread"
            @click="spreadIndex = Math.min(4, spreadIndex + 1)"
          >
            <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </template>

      <!-- Mode 3: Real Flat Imposed Sheet -->
      <div v-else class="flat-sheet-wrap">
        <div class="sheet-inner">
          <SheetPreview review @select="emit('backToDesign')" />
        </div>
      </div>

      <!-- Empty state callout -->
      <div v-if="filledCount === 0" class="empty-callout">
        <span>Blank zine ·</span>
        <button type="button" class="empty-link" @click="populateSampleZine">
          Fill with 8-page sample
        </button>
      </div>
    </div>
  </section>

  <!-- Right Cream Panel: Real ReviewPanel + 3D inspection helpers -->
  <aside v-if="isDesktop" class="inspector ed-light ed-scroll proto-b-panel">
    <ReviewPanel />

    <hr class="b-hr">

    <div class="b-block">
      <h2 class="ed-display">3D Inspection</h2>
      <div class="b-telemetry">
        <span>MODE: <strong>{{ theaterMode === 'fold' ? 'CUT & FOLD' : theaterMode.toUpperCase() }}</strong></span>
        <span v-if="theaterMode === 'booklet'">ANGLE: <strong>{{ Math.round(telemetry.rotY) }}° / {{ Math.round(telemetry.rotX) }}°</strong></span>
        <span v-else-if="theaterMode === 'fold'">PROGRESS: <strong>{{ Math.round(foldAmount * 100) }}%</strong></span>
      </div>

      <div v-if="theaterMode === 'fold'" class="b-actions">
        <button type="button" class="ed-btn-line" @click="startFullFoldPlay(true)">
          <UIcon name="i-lucide-play" aria-hidden="true" />
          Play full
        </button>
        <button type="button" class="ed-btn-line" @click="foldRef?.resetCamera()">
          Auto camera
        </button>
        <button type="button" class="ed-btn-line" @click="foldRef?.setPose(58, 0, 1)">
          Top view
        </button>
        <button type="button" class="ed-btn-line" @click="setMode('booklet')">
          Swipe 3D zine
        </button>
      </div>

      <div v-else-if="theaterMode === 'booklet'" class="b-actions">
        <button type="button" class="ed-btn-line" @click="toggleTurntable">
          <UIcon :name="isSpinning ? 'i-lucide-square' : 'i-lucide-refresh-cw'" aria-hidden="true" />
          {{ isSpinning ? 'Stop spin' : 'Auto-spin 360°' }}
        </button>
        <button type="button" class="ed-btn-line" @click="bookletRef?.setPose(12, 180, 1)">
          Flip to back
        </button>
        <button type="button" class="ed-btn-line" @click="bookletRef?.resetCamera()">
          Reset camera
        </button>
        <button type="button" class="ed-btn-line" @click="setMode('fold'); startFullFoldPlay(true)">
          Watch cut &amp; fold
        </button>
      </div>

      <button type="button" class="ed-btn-line is-full" @click="populateSampleZine">
        <UIcon name="i-lucide-sparkles" aria-hidden="true" />
        {{ filledCount > 0 ? 'Reload 8-page sample' : 'Fill 8-page sample' }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.proto-b-theater {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--ed-canvas);
}

.theater-head {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--line);
}

.theater-title h2 {
  margin: 0;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
}

.theater-title p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.ed-segment.is-fit .ed-segment-item {
  flex: none;
  padding: 7px 12px;
}

.theater-stage {
  position: relative;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at 50% 42%, #221d19 0%, #100e0d 72%);
}

.handoff-cta {
  position: absolute;
  bottom: 132px;
  left: 50%;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 2px solid var(--ink-dark);
  background: var(--acid);
  box-shadow: 4px 4px 0 var(--orange-deep);
  color: var(--ink-dark);
  font-size: 13px;
  font-weight: 700;
  transform: translateX(-50%);
}

.handoff-cta:hover {
  transform: translateX(-50%) translate(-1px, -1px);
}

.scrubber-deck,
.fold-deck {
  position: absolute;
  bottom: 58px;
  left: 50%;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(600px, calc(100% - 32px));
  padding: 10px 14px;
  border: 1px solid var(--line);
  background: rgb(11 10 9 / 92%);
  box-shadow: 6px 6px 0 rgb(0 0 0 / 45%);
  transform: translateX(-50%);
}

.deck-arrow,
.loop-btn {
  display: grid;
  flex: none;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
}

.deck-arrow:hover:not(:disabled),
.loop-btn:hover {
  border-color: var(--acid);
  color: var(--acid);
}

.loop-btn.is-on {
  border-color: var(--acid);
  background: var(--acid);
  color: var(--ink-dark);
}

.deck-arrow:disabled {
  opacity: 0.35;
}

.scrubber-mid,
.fold-slider-wrap {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.scrubber-stops,
.fold-steps {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.stop-btn,
.fold-steps button {
  padding: 2px 6px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-family: var(--font-type);
  font-size: 11px;
  white-space: nowrap;
}

.stop-btn:hover,
.fold-steps button:hover {
  color: var(--ink);
}

.stop-btn.is-active,
.fold-steps button.is-on {
  background: var(--acid);
  color: var(--ink-dark);
  font-weight: 700;
}

.scrubber-range {
  width: 100%;
  accent-color: var(--acid);
  cursor: pointer;
}

.play-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 0;
  background: var(--orange);
  box-shadow: 3px 3px 0 var(--orange-deep);
  color: var(--ink-dark);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.fold-pct {
  flex: none;
  width: 38px;
  color: var(--acid);
  font-family: var(--font-type);
  font-size: 12px;
  text-align: right;
}

.flat-sheet-wrap {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px 24px 72px;
}

.sheet-inner {
  width: min(100%, (100dvh - 240px) * 297 / 210);
}

.empty-callout {
  position: absolute;
  top: 14px;
  right: 16px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--orange);
  background: rgb(11 10 9 / 90%);
  color: var(--muted);
  font-size: 12px;
}

.empty-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--acid);
  font-weight: 700;
  text-decoration: underline;
}

.proto-b-panel {
  flex: none;
  width: 320px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.b-hr {
  height: 1px;
  margin: 0;
  border: 0;
  background: rgb(11 10 9 / 15%);
}

.b-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.b-telemetry {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border: 1px solid var(--ed-hairline);
  background: #fff;
  font-family: var(--font-type);
  font-size: 11px;
  color: var(--text-dark);
}

.b-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.is-full {
  width: 100%;
}
</style>
