<script setup lang="ts">
import { computed, ref } from 'vue'
import { PAGE_IDS, type PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZinePageLabels } from '~/composables/useZinePageLabels'
import { useZine3DTextures } from '~/composables/useZine3DTextures.client'
import { populateSampleZine } from '~/utils/zinePrototypeSample.client'
import ZineBooklet3D, { type BookletTelemetry } from '~/components/zine/prototype/ZineBooklet3D.client.vue'

// PROTOTYPE — Variant C: "Full-Bleed Tactile 3D Reader"
// Opens a distraction-free full-viewport reader over the editor:
//   - Big, generous pocket-zine stage with corner hover-peel & handheld rocking
//   - Direct horizontal swipe to flip pages + vertical drag to tilt
//   - Tactile 360° Turntable Spin Slider + instant handheld poses
//   - One-click "Edit this page" jump back into the 2D canvas

const SPREADS: ReadonlyArray<{ index: number; label: string; pages: PageId[] }> = [
  { index: 0, label: 'Front Cover', pages: ['front-cover'] },
  { index: 1, label: 'Pages 1 – 2', pages: ['p1', 'p2'] },
  { index: 2, label: 'Pages 3 – 4', pages: ['p3', 'p4'] },
  { index: 3, label: 'Pages 5 – 6', pages: ['p5', 'p6'] },
  { index: 4, label: 'Back Cover', pages: ['back-cover'] }
]

const POSES = [
  { id: 'handheld', label: 'Handheld', rotX: 12, rotY: -16, zoom: 1.05 },
  { id: 'flat', label: 'Flat Open', rotX: 44, rotY: 0, zoom: 0.98 },
  { id: 'stand', label: 'Stand Up', rotX: 5, rotY: -34, zoom: 1.02 },
  { id: 'back', label: 'Back Side', rotX: 10, rotY: 180, zoom: 1.05 }
] as const

const emit = defineEmits<{
  close: []
  editPage: [pageId: PageId]
}>()

const { state } = useZineStore()
const { pageLabel } = useZinePageLabels()
const { textures, hasContent, filledCount } = useZine3DTextures()

const bookletRef = ref<InstanceType<typeof ZineBooklet3D> | null>(null)
const spreadIndex = ref(
  Math.max(0, SPREADS.findIndex((s) => s.pages.includes(state.value.selectedPageId)))
)
const activePoseId = ref<string>('handheld')
const spinYaw = ref(-16)

const telemetry = ref<BookletTelemetry>({
  progress: spreadIndex.value,
  spreadIndex: spreadIndex.value,
  rotX: 12,
  rotY: -16,
  zoom: 1.05,
  gesture: 'idle'
})

const pageLabels = computed(() =>
  PAGE_IDS.reduce((acc, id) => {
    acc[id] = pageLabel(id)
    return acc
  }, {} as Record<PageId, string>)
)

const currentSpread = computed(() => SPREADS[spreadIndex.value] ?? SPREADS[0]!)
const primaryPageId = computed<PageId>(() => currentSpread.value.pages[0] ?? 'front-cover')

function handleTelemetry(data: BookletTelemetry) {
  telemetry.value = data
  // Keep dial synced when user orbits directly on the stage
  const wrapped = ((((data.rotY % 360) + 540) % 360) - 180)
  spinYaw.value = Math.round(wrapped)
}

function onSpinInput(event: Event) {
  const nextYaw = Number((event.target as HTMLInputElement).value)
  spinYaw.value = nextYaw
  activePoseId.value = 'custom'
  bookletRef.value?.setPose(telemetry.value.rotX, nextYaw, telemetry.value.zoom)
}

function selectPose(pose: typeof POSES[number]) {
  activePoseId.value = pose.id
  spinYaw.value = pose.rotY
  bookletRef.value?.setPose(pose.rotX, pose.rotY, pose.zoom)
}

function jumpToEdit() {
  emit('editPage', primaryPageId.value)
}
</script>

<template>
  <div class="reader-overlay" role="dialog" aria-modal="true" aria-label="3D Zine Reader">
    <!-- Minimal top studio header -->
    <header class="reader-top">
      <div class="reader-meta">
        <span class="reader-tag">3D READER</span>
        <h1>{{ currentSpread.label }}</h1>
        <span class="reader-sub">{{ filledCount }} / 8 pages · {{ Math.round(telemetry.rotY) }}° yaw</span>
      </div>

      <div class="reader-actions">
        <button
          v-if="filledCount === 0"
          type="button"
          class="r-btn is-acid"
          @click="populateSampleZine"
        >
          <UIcon name="i-lucide-sparkles" aria-hidden="true" />
          Fill sample zine
        </button>

        <button type="button" class="r-btn" @click="jumpToEdit">
          <UIcon name="i-lucide-pencil" aria-hidden="true" />
          Edit {{ pageLabel(primaryPageId) }}
        </button>

        <button type="button" class="r-close" aria-label="Close 3D reader" @click="emit('close')">
          <UIcon name="i-lucide-x" aria-hidden="true" />
        </button>
      </div>
    </header>

    <!-- Full-bleed interactive tactile stage -->
    <main class="reader-stage">
      <ZineBooklet3D
        ref="bookletRef"
        :textures="textures"
        :has-content="hasContent"
        :page-labels="pageLabels"
        :spread="spreadIndex"
        interaction-mode="swipe-first"
        paper-style="newsprint"
        show-corner-hint
        handheld-rock
        :initial-rot-x="12"
        :initial-rot-y="-16"
        :initial-zoom="1.05"
        :max-page-height="540"
        @update:spread="spreadIndex = $event"
        @telemetry="handleTelemetry"
      />

      <!-- Subtle floating side flip buttons for one-tap turning -->
      <button
        type="button"
        class="side-nav is-left"
        :disabled="spreadIndex <= 0"
        aria-label="Previous spread"
        @click="spreadIndex = Math.max(0, spreadIndex - 1)"
      >
        <UIcon name="i-lucide-chevron-left" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="side-nav is-right"
        :disabled="spreadIndex >= 4"
        aria-label="Next spread"
        @click="spreadIndex = Math.min(4, spreadIndex + 1)"
      >
        <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
      </button>
    </main>

    <!-- Tactile Turntable & Pose Gimbal Dock -->
    <footer class="gimbal-dock">
      <div class="dock-row">
        <!-- 5-spread tactile dots -->
        <div class="dots" role="tablist" aria-label="Spread position">
          <button
            v-for="s in SPREADS"
            :key="s.index"
            type="button"
            class="dot"
            :class="{ 'is-active': spreadIndex === s.index }"
            :title="s.label"
            @click="spreadIndex = s.index"
          >
            <span>{{ s.index === 0 ? 'C' : s.index === 4 ? 'B' : s.index }}</span>
          </button>
        </div>

        <!-- 360° Turntable Spin Slider -->
        <label class="spin-control">
          <span class="spin-label">
            <UIcon name="i-lucide-rotate-3d" aria-hidden="true" />
            360° SPIN
          </span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            :value="spinYaw"
            class="spin-range"
            @input="onSpinInput"
          >
          <span class="spin-val">{{ spinYaw }}°</span>
        </label>

        <!-- Instant tactile poses -->
        <div class="pose-group">
          <button
            v-for="pose in POSES"
            :key="pose.id"
            type="button"
            class="pose-btn"
            :class="{ 'is-active': activePoseId === pose.id }"
            @click="selectPose(pose)"
          >
            {{ pose.label }}
          </button>
        </div>
      </div>

      <p class="gimbal-tip">
        Swipe left/right on the zine to flip · Drag vertically or outside to rotate freely · Scroll to zoom
      </p>
    </footer>
  </div>
</template>

<style scoped>
.reader-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% 44%, #241f1b 0%, #0b0a09 78%);
  color: var(--ink);
}

.reader-top {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid rgb(237 231 218 / 10%);
}

.reader-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.reader-tag {
  padding: 3px 7px;
  background: var(--orange);
  color: var(--ink-dark);
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.reader-meta h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

.reader-sub {
  color: var(--muted);
  font-family: var(--font-type);
  font-size: 12px;
  white-space: nowrap;
}

.reader-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.r-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
}

.r-btn:hover {
  background: var(--ink);
  color: var(--ink-dark);
}

.r-btn.is-acid {
  border-color: var(--acid);
  background: var(--acid);
  color: var(--ink-dark);
  font-weight: 700;
}

.r-close {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
}

.r-close:hover {
  border-color: var(--orange);
  color: var(--orange);
}

.reader-stage {
  position: relative;
  min-height: 0;
  flex: 1;
}

.side-nav {
  position: absolute;
  top: 50%;
  z-index: 5;
  display: grid;
  width: 48px;
  height: 76px;
  place-items: center;
  border: 1px solid rgb(237 231 218 / 16%);
  background: rgb(11 10 9 / 58%);
  color: var(--ink);
  transform: translateY(-50%);
  transition: border-color 150ms ease, background 150ms ease;
}

.side-nav.is-left { left: 20px; }
.side-nav.is-right { right: 20px; }

.side-nav:hover:not(:disabled) {
  border-color: var(--acid);
  background: rgb(11 10 9 / 90%);
  color: var(--acid);
}

.side-nav:disabled {
  opacity: 0.2;
}

.side-nav .iconify {
  width: 24px;
  height: 24px;
}

.gimbal-dock {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 24px 66px;
  border-top: 1px solid rgb(237 231 218 / 10%);
  background: rgb(11 10 9 / 76%);
}

.dock-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  max-width: 960px;
}

.dots {
  display: inline-flex;
  gap: 4px;
}

.dot {
  width: 28px;
  height: 28px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-family: var(--font-type);
  font-size: 11px;
}

.dot:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.dot.is-active {
  border-color: var(--acid);
  background: var(--acid);
  color: var(--ink-dark);
  font-weight: 700;
}

.spin-control {
  display: flex;
  min-width: 220px;
  flex: 1 1 240px;
  max-width: 340px;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border: 1px solid var(--line);
  background: #141210;
}

.spin-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-family: var(--font-type);
  font-size: 11px;
  white-space: nowrap;
}

.spin-range {
  flex: 1;
  min-width: 80px;
  accent-color: var(--orange);
  cursor: pointer;
}

.spin-val {
  width: 38px;
  color: var(--acid);
  font-family: var(--font-type);
  font-size: 12px;
  text-align: right;
}

.pose-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pose-btn {
  padding: 6px 10px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.pose-btn:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.pose-btn.is-active {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--ink-dark);
}

.gimbal-tip {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 760px) {
  .reader-sub {
    display: none;
  }

  .side-nav {
    display: none;
  }

  .gimbal-dock {
    padding: 10px 12px 58px;
  }
}
</style>
