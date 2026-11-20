<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { PageId } from '~/types/zine'

// PROTOTYPE: Exact 4-step 3D Cut & Fold animation for an 8-page single-sheet A4 zine.
//   0.00 – 0.22 : Animated scissors snip the red center slit (25% → 75%)
//   0.22 – 0.46 : Lengthwise hot-dog fold (upside-down top row folds 180° behind)
//   0.46 – 0.74 : Push outer ends inward — cut slit pops open into a 3D diamond / + cross
//   0.74 – 1.00 : Close the 4 wings into the finished 8-page pocket zine

const PANEL_ASPECT = 105 / 74.25

export type FoldStage = {
  id: 'flat' | 'cut' | 'half' | 'cross' | 'booklet'
  step: string
  title: string
  detail: string
  value: number
}

const props = withDefaults(defineProps<{
  textures: Record<PageId, string>
  hasContent: Record<PageId, boolean>
  pageLabels: Record<PageId, string>
  fold: number // 0 = flat A4 sheet, 1 = fully cut & folded pocket zine
  showGuides?: boolean
}>(), {
  showGuides: true
})

const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(680)
const stageHeight = ref(480)

// User orbit offset added on top of subtle choreographed camera motion
const userRotX = ref(0)
const userRotY = ref(0)
const hasManualOrbit = ref(false)
const zoom = ref(1)
const dragging = ref(false)

let pointerId: number | null = null
let lastX = 0
let lastY = 0
let resizeObserver: ResizeObserver | null = null

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

// 4 physically exact phases
const tCut = computed(() => clamp(props.fold / 0.22, 0, 1))
const tHalf = computed(() => smoothstep(0.22, 0.46, props.fold))
const tPush = computed(() => smoothstep(0.46, 0.74, props.fold))
const tClose = computed(() => smoothstep(0.74, 1.0, props.fold))

// Exact angles in degrees
const alphaDeg = computed(() => 90 * tPush.value)
const betaDeg = computed(() => 90 * tClose.value)

// Choreographed camera angles so the user sees the flat sheet clearly during the cut,
// tilts down to reveal the diamond/+ cross opening from above, then frames the finished cover!
const autoRotX = computed(() => {
  // Start almost flat (14°) for the cut, tilt to 36° to show the 3D diamond/cross clearly, settle at 16°
  const cutToHalf = 14 + tHalf.value * 14
  const crossLift = Math.sin(tPush.value * Math.PI) * 18 + tPush.value * 12
  const closeSettle = tClose.value * -24
  return cutToHalf + crossLift + closeSettle
})

const autoRotY = computed(() => {
  // Gentle 3/4 turn during the half-fold & diamond push so depth pops out immediately
  return -6 - tHalf.value * 14 - Math.sin(tPush.value * Math.PI) * 14 - tClose.value * 4
})

const rotX = computed(() => clamp((hasManualOrbit.value ? 18 : autoRotX.value) + userRotX.value, -80, 80))
const rotY = computed(() => (hasManualOrbit.value ? -18 : autoRotY.value) + userRotY.value)

const currentStage = computed<FoldStage>(() => {
  if (props.fold < 0.02) {
    return {
      id: 'flat',
      step: '0 / 4',
      title: 'Flat A4 sheet',
      detail: 'Top row prints upside down — cut only the red center line.',
      value: 0
    }
  }
  if (props.fold < 0.23) {
    return {
      id: 'cut',
      step: '1 / 4',
      title: 'Cut the center slit',
      detail: 'Snip along the red line between the two center creases.',
      value: 0.22
    }
  }
  if (props.fold < 0.47) {
    return {
      id: 'half',
      step: '2 / 4',
      title: 'Fold lengthwise in half',
      detail: 'The upside-down top row swings behind and turns right-side up.',
      value: 0.46
    }
  }
  if (props.fold < 0.75) {
    return {
      id: 'cross',
      step: '3 / 4',
      title: 'Push ends toward center',
      detail: 'The cut slit pops open into a 3D diamond, then a + cross.',
      value: 0.74
    }
  }
  return {
    id: 'booklet',
    step: '4 / 4',
    title: 'Close like a book',
    detail: 'All 4 wings wrap into an 8-page pocket zine (74 × 105 mm).',
    value: 1
  }
})

// Size one panel so the flat 4×2 sheet fits comfortably when unfolded and scales up as it folds
const panelW = computed(() => {
  const byWidth = Math.max(74, (stageWidth.value - 96) / 4.45)
  const byHeight = Math.max(74, ((stageHeight.value - 135) / 2.45) / PANEL_ASPECT)
  return Math.round(Math.min(156, byWidth, byHeight))
})

const panelH = computed(() => Math.round(panelW.value * PANEL_ASPECT))

// Smoothly zoom in as the 4×2 sheet compacts into a 1×1 booklet
const autoScale = computed(() => 1 + tHalf.value * 0.16 + tPush.value * 0.24 + tClose.value * 0.34)

// Exact continuous center-of-mass compensation across all 4 stages (zero jump!)
const rigShiftX = computed(() => {
  const w = panelW.value
  const alphaRad = (alphaDeg.value * Math.PI) / 180
  const paperCenterX = w * Math.cos(alphaRad) + (w / 2) * tClose.value
  return (w / 2) - paperCenterX
})

const rigShiftY = computed(() => (panelH.value / 2) * (1 - tHalf.value))

const rigStyle = computed<CSSProperties>(() => ({
  width: `${panelW.value}px`,
  height: `${panelH.value}px`,
  transform: [
    `scale(${(zoom.value * autoScale.value).toFixed(3)})`,
    `rotateX(${rotX.value.toFixed(2)}deg)`,
    `rotateY(${rotY.value.toFixed(2)}deg)`,
    `translate3d(${rigShiftX.value.toFixed(2)}px, ${rigShiftY.value.toFixed(2)}px, 0px)`
  ].join(' ')
}))

// ── Exact kinematic hinge tree rooted at `front-cover` ──────────────────────
// Every `translateZ` is applied BEFORE its `rotateX`/`rotateY` so separation
// happens in the parent's unrotated frame. All 16 faces (8 printed + 8 blank)
// sit tightly pressed in a realistic ~5.1px paper stack (+0.18px to -5.28px)
// with guaranteed clearance and zero overlap.

const rootPivotStyle = computed<CSSProperties>(() => ({
  transform: `rotateY(${(-alphaDeg.value + betaDeg.value).toFixed(2)}deg)`
}))

// p1: right child of front-cover (50% fore-edge) -> folds +2α behind front-cover (-0.6px)
const hingeP1 = computed<CSSProperties>(() => {
  const angle = 2 * alphaDeg.value
  const z = -0.6 * tPush.value
  return {
    transform: `translateZ(${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`
  }
})

// p2: right child of p1 (75% inner spine). Because p1 is rotated +180° at close,
// +Z in p1's local frame points toward WORLD -Z (deeper into the closed stack).
const hingeP2 = computed<CSSProperties>(() => {
  const angle = -alphaDeg.value - betaDeg.value
  const z = 0.9 * tClose.value
  return {
    transform: `translateZ(${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`
  }
})

// p3: top child of p2 (horizontal fold 75..100%) -> shifts -0.6px behind p2, then folds 180°
const hingeP3 = computed<CSSProperties>(() => {
  const angle = 180 * tHalf.value
  const z = -0.6 * tHalf.value
  return {
    transform: `translateZ(${z.toFixed(2)}px) rotateX(${angle.toFixed(2)}deg)`
  }
})

// p4: left child of p3 (75% top inner spine). Because p3 has rotateX(180°),
// +Z in p3's local frame points toward WORLD -Z (deeper into the stack).
const hingeP4 = computed<CSSProperties>(() => {
  const angle = alphaDeg.value + betaDeg.value
  const zPre = 0.9 * tClose.value
  // Slight separation from p5 while they sit back-to-back in the `+` cross wing
  const zCross = 0.6 * Math.sin(tPush.value * Math.PI * 0.5) * (1 - tClose.value)
  return {
    transform: `translateZ(${zPre.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg) translateZ(${zCross.toFixed(2)}px)`
  }
})

// back-cover: left child of front-cover (25% outer spine) -> wraps tightly behind all 4 leaves (-5.1px)
const hingeBackCover = computed<CSSProperties>(() => {
  const angle = alphaDeg.value - 3 * betaDeg.value
  const z = -5.1 * tClose.value
  return {
    transform: `translateZ(${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`
  }
})

// p6: top child of back-cover (horizontal fold 0..25%) -> shifts -0.6px in back-cover's frame, then folds 180°
const hingeP6 = computed<CSSProperties>(() => {
  const angle = 180 * tHalf.value
  const z = -0.6 * tHalf.value
  return {
    transform: `translateZ(${z.toFixed(2)}px) rotateX(${angle.toFixed(2)}deg)`
  }
})

// p5: right child of p6 (25% top inner spine). At close, p6's local +Z points toward WORLD +Z (inside the book).
const hingeP5 = computed<CSSProperties>(() => {
  const angle = -alphaDeg.value - betaDeg.value
  const zPre = 0.9 * tClose.value
  const zCross = 0.6 * Math.sin(tPush.value * Math.PI * 0.5) * (1 - tClose.value)
  return {
    transform: `translateZ(${zPre.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg) translateZ(${zCross.toFixed(2)}px)`
  }
})

// Closed folded spine strip along x = 0 so the left edge reads as one crisp folded booklet
const closedSpineStyle = computed<CSSProperties>(() => ({
  opacity: clamp((tClose.value - 0.72) / 0.28, 0, 1).toFixed(3)
}))

// Subtle dynamic shade as panels swing away from the overhead light
const backHalfShade = computed(() => (0.14 * Math.sin(tHalf.value * Math.PI)).toFixed(3))
const wingShade = computed(() => (0.22 * Math.sin(tPush.value * Math.PI)).toFixed(3))

// Animated scissors riding along the 25%..75% center cut line during Step 1
const showScissors = computed(() => props.fold > 0.005 && props.fold < 0.25)
const scissorsStyle = computed<CSSProperties>(() => {
  const x = tCut.value * panelW.value * 2
  const snip = Math.sin(tCut.value * Math.PI * 10)
  return {
    transform: `translate3d(${x.toFixed(1)}px, 0px, 14px) rotate(${(-6 + snip * 8).toFixed(1)}deg)`
  }
})
const bladeTopAngle = computed(() => (-16 - Math.abs(Math.sin(tCut.value * Math.PI * 10)) * 22).toFixed(1))
const bladeBotAngle = computed(() => (16 + Math.abs(Math.sin(tCut.value * Math.PI * 10)) * 22).toFixed(1))

// Cut slit progress on front-cover (first half: 0..0.5 of tCut) and p1 (second half: 0.5..1 of tCut)
const slitFrontPct = computed(() => `${(clamp(tCut.value * 2, 0, 1) * 100).toFixed(1)}%`)
const slitP1Pct = computed(() => `${(clamp((tCut.value - 0.5) * 2, 0, 1) * 100).toFixed(1)}%`)

// Visible slit gap on top edge of front-cover/p1 once cut and before fold closes
const showSlitGuide = computed(() => props.showGuides && props.fold < 0.6)

function setPose(nextRotX: number, nextRotY: number, nextZoom = 1) {
  hasManualOrbit.value = true
  userRotX.value = clamp(nextRotX - 18, -98, 62)
  userRotY.value = nextRotY + 18
  zoom.value = clamp(nextZoom, 0.6, 1.8)
}

function resetCamera() {
  hasManualOrbit.value = false
  userRotX.value = 0
  userRotY.value = 0
  zoom.value = 1
}

defineExpose({ setPose, resetCamera, currentStage })

function handlePointerDown(event: PointerEvent) {
  const el = stageRef.value
  if (!el) return
  pointerId = event.pointerId
  el.setPointerCapture(event.pointerId)
  lastX = event.clientX
  lastY = event.clientY
  dragging.value = true
}

function handlePointerMove(event: PointerEvent) {
  if (pointerId === null || event.pointerId !== pointerId) return
  const dx = event.clientX - lastX
  const dy = event.clientY - lastY
  if (!hasManualOrbit.value && Math.hypot(dx, dy) > 2) {
    // Capture current auto pose so transition to manual orbit is seamless (no jump)
    userRotX.value = autoRotX.value - 18
    userRotY.value = autoRotY.value + 18
    hasManualOrbit.value = true
  }
  userRotY.value += dx * 0.48
  userRotX.value = clamp(userRotX.value - dy * 0.38, -98, 62)
  lastX = event.clientX
  lastY = event.clientY
}

function handlePointerUp(event: PointerEvent) {
  if (pointerId === null || event.pointerId !== pointerId) return
  const el = stageRef.value
  if (el?.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
  pointerId = null
  dragging.value = false
}

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  zoom.value = clamp(zoom.value - event.deltaY * 0.0012, 0.6, 1.8)
}

onMounted(() => {
  const el = stageRef.value
  if (!el) return
  const sync = () => {
    stageWidth.value = el.clientWidth || 680
    stageHeight.value = el.clientHeight || 480
  }
  sync()
  resizeObserver = new ResizeObserver(sync)
  resizeObserver.observe(el)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="stageRef"
    class="fold-stage"
    :class="{ 'is-dragging': dragging }"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @wheel.prevent="handleWheel"
    @dblclick="resetCamera"
  >
    <div class="fold-scene">
      <div class="sheet-rig" :style="rigStyle">
        <!-- Root pivot rotates front-cover around its left edge (25% outer spine) -->
        <div class="root-pivot" :style="rootPivotStyle">
          <!-- Closed booklet folded spine edge -->
          <div class="closed-spine" :style="closedSpineStyle" aria-hidden="true" />
          <!-- Root panel: front-cover (col 1, row 1) -->
          <div class="panel is-root">
            <div class="p-face is-printed">
              <img v-if="textures['front-cover']" :src="textures['front-cover']" alt="Front cover" draggable="false">
              <span v-if="!hasContent['front-cover']" class="p-stamp">{{ pageLabels['front-cover'] }}</span>
              <span v-if="showGuides && fold < 0.7" class="crease is-right" />
              <span v-if="showGuides && fold < 0.7" class="crease is-left" />
              <span v-if="showSlitGuide" class="cut-guide" />
              <span v-if="showSlitGuide && tCut > 0" class="cut-slit" :style="{ width: slitFrontPct }" />
              <span class="p-shade" :style="{ opacity: wingShade }" />
            </div>
            <div class="p-face is-blank" />

            <!-- Animated snipping scissors riding across front-cover → p1 during Step 1 -->
            <div v-if="showScissors" class="scissors-runner" :style="scissorsStyle" aria-hidden="true">
              <svg viewBox="0 0 48 48" class="scissors-svg">
                <g :transform="`rotate(${bladeTopAngle} 20 24)`">
                  <path d="M20 24 L45 19 L42 23 Z" fill="#ede7da" stroke="#0b0a09" stroke-width="1.6" />
                  <circle cx="11" cy="16" r="5.5" fill="none" stroke="#d25a36" stroke-width="3" />
                  <line x1="15.5" y1="19" x2="21" y2="24" stroke="#d25a36" stroke-width="2.6" />
                </g>
                <g :transform="`rotate(${bladeBotAngle} 20 24)`">
                  <path d="M20 24 L45 29 L42 25 Z" fill="#f4f0e8" stroke="#0b0a09" stroke-width="1.6" />
                  <circle cx="11" cy="32" r="5.5" fill="none" stroke="#d25a36" stroke-width="3" />
                  <line x1="15.5" y1="29" x2="21" y2="24" stroke="#d25a36" stroke-width="2.6" />
                </g>
                <circle cx="20" cy="24" r="2.2" fill="#e9ff5c" stroke="#0b0a09" stroke-width="1.2" />
              </svg>
            </div>

            <!-- Left child of front-cover: back-cover (col 0, row 1), hinged at left edge x=0 -->
            <div class="hinge is-left" :style="hingeBackCover">
              <div class="panel">
                <div class="p-face is-printed">
                  <img v-if="textures['back-cover']" :src="textures['back-cover']" alt="Back cover" draggable="false">
                  <span v-if="!hasContent['back-cover']" class="p-stamp">{{ pageLabels['back-cover'] }}</span>
                  <span v-if="showGuides && fold < 0.7" class="crease is-top" />
                </div>
                <div class="p-face is-blank" />

                <!-- Top child of back-cover: p6 (col 0, row 0, upside down), hinged at top edge y=0 -->
                <div class="hinge is-top" :style="hingeP6">
                  <div class="panel">
                    <div class="p-face is-printed is-upside-down">
                      <img v-if="textures.p6" :src="textures.p6" alt="Page 6" draggable="false">
                      <span v-if="!hasContent.p6" class="p-stamp">{{ pageLabels.p6 }}</span>
                      <span class="p-shade" :style="{ opacity: backHalfShade }" />
                    </div>
                    <div class="p-face is-blank" />

                    <!-- Right child of p6: p5 (col 1, row 0, upside down), hinged at right edge x=W -->
                    <div class="hinge is-right" :style="hingeP5">
                      <div class="panel">
                        <div class="p-face is-printed is-upside-down">
                          <img v-if="textures.p5" :src="textures.p5" alt="Page 5" draggable="false">
                          <span v-if="!hasContent.p5" class="p-stamp">{{ pageLabels.p5 }}</span>
                          <span v-if="showSlitGuide" class="cut-guide is-bottom" />
                          <span v-if="showSlitGuide && tCut > 0" class="cut-slit is-bottom" :style="{ width: slitFrontPct }" />
                          <span class="p-shade" :style="{ opacity: wingShade }" />
                        </div>
                        <div class="p-face is-blank" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right child of front-cover: p1 (col 2, row 1), hinged at right edge x=W -->
            <div class="hinge is-right" :style="hingeP1">
              <div class="panel">
                <div class="p-face is-printed">
                  <img v-if="textures.p1" :src="textures.p1" alt="Page 1" draggable="false">
                  <span v-if="!hasContent.p1" class="p-stamp">{{ pageLabels.p1 }}</span>
                  <span v-if="showGuides && fold < 0.7" class="crease is-right" />
                  <span v-if="showSlitGuide" class="cut-guide" />
                  <span v-if="showSlitGuide && tCut > 0.5" class="cut-slit" :style="{ width: slitP1Pct }" />
                  <span class="p-shade" :style="{ opacity: wingShade }" />
                </div>
                <div class="p-face is-blank" />

                <!-- Right child of p1: p2 (col 3, row 1), hinged at right edge x=W -->
                <div class="hinge is-right" :style="hingeP2">
                  <div class="panel">
                    <div class="p-face is-printed">
                      <img v-if="textures.p2" :src="textures.p2" alt="Page 2" draggable="false">
                      <span v-if="!hasContent.p2" class="p-stamp">{{ pageLabels.p2 }}</span>
                      <span v-if="showGuides && fold < 0.7" class="crease is-top" />
                    </div>
                    <div class="p-face is-blank" />

                    <!-- Top child of p2: p3 (col 3, row 0, upside down), hinged at top edge y=0 -->
                    <div class="hinge is-top" :style="hingeP3">
                      <div class="panel">
                        <div class="p-face is-printed is-upside-down">
                          <img v-if="textures.p3" :src="textures.p3" alt="Page 3" draggable="false">
                          <span v-if="!hasContent.p3" class="p-stamp">{{ pageLabels.p3 }}</span>
                          <span class="p-shade" :style="{ opacity: backHalfShade }" />
                        </div>
                        <div class="p-face is-blank" />

                        <!-- Left child of p3: p4 (col 2, row 0, upside down), hinged at left edge x=0 -->
                        <div class="hinge is-left" :style="hingeP4">
                          <div class="panel">
                            <div class="p-face is-printed is-upside-down">
                              <img v-if="textures.p4" :src="textures.p4" alt="Page 4" draggable="false">
                              <span v-if="!hasContent.p4" class="p-stamp">{{ pageLabels.p4 }}</span>
                              <span v-if="showSlitGuide" class="cut-guide is-bottom" />
                              <span v-if="showSlitGuide && tCut > 0.5" class="cut-slit is-bottom is-from-right" :style="{ width: slitP1Pct }" />
                              <span class="p-shade" :style="{ opacity: wingShade }" />
                            </div>
                            <div class="p-face is-blank" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step callout pill -->
    <div class="phase-card">
      <span class="phase-step">{{ currentStage.step }}</span>
      <div class="phase-copy">
        <strong>{{ currentStage.title }}</strong>
        <span>{{ currentStage.detail }}</span>
      </div>
      <button
        v-if="hasManualOrbit"
        type="button"
        class="cam-reset"
        title="Return to auto camera"
        @pointerdown.stop
        @click="resetCamera"
      >
        Auto cam
      </button>
    </div>
  </div>
</template>

<style scoped>
.fold-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.fold-stage.is-dragging {
  cursor: grabbing;
}

.fold-scene {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  perspective: 1450px;
  perspective-origin: 50% 48%;
}

.sheet-rig {
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
}

.root-pivot {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: left center;
  transform-style: preserve-3d;
  will-change: transform;
}

.panel {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.hinge {
  position: absolute;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

.hinge.is-left {
  top: 0;
  left: -100%;
  transform-origin: right center;
}

.hinge.is-right {
  top: 0;
  left: 100%;
  transform-origin: left center;
}

.hinge.is-top {
  top: -100%;
  left: 0;
  transform-origin: center bottom;
}

.p-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border: 1px solid rgb(11 10 9 / 18%);
}

.closed-spine {
  position: absolute;
  top: 0;
  left: -2.8px;
  width: 5.6px;
  height: 100%;
  background: linear-gradient(to right, #d6d0c4, #f4f0e8 45%, #cbc4b7);
  transform: translateZ(-2.55px) rotateY(90deg);
  pointer-events: none;
}

.p-face.is-printed {
  background: #faf8f4;
  transform: translateZ(0.18px);
}

.p-face.is-blank {
  background: #e9e4d9;
  transform: rotateY(180deg) translateZ(0.18px);
}

.p-face.is-printed img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}

.p-face.is-upside-down img,
.p-face.is-upside-down .p-stamp {
  transform: rotate(180deg);
}

.p-stamp {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgb(11 10 9 / 30%);
  font-family: var(--font-display);
  font-size: 16px;
  text-transform: uppercase;
  pointer-events: none;
}

.p-shade {
  position: absolute;
  inset: 0;
  background: #0b0a09;
  pointer-events: none;
}

/* Fold creases & animated center cut */
.crease {
  position: absolute;
  pointer-events: none;
}

.crease.is-right {
  top: 0;
  right: 0;
  bottom: 0;
  border-right: 1px dashed rgb(11 10 9 / 28%);
}

.crease.is-left {
  top: 0;
  bottom: 0;
  left: 0;
  border-left: 1px dashed rgb(11 10 9 / 28%);
}

.crease.is-top {
  top: 0;
  right: 0;
  left: 0;
  border-top: 1px dashed rgb(11 10 9 / 28%);
}

.cut-guide {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  border-top: 2px dashed rgb(229 55 43 / 55%);
  pointer-events: none;
}

.cut-guide.is-bottom {
  top: auto;
  bottom: 0;
  border-top: 0;
  border-bottom: 2px dashed rgb(229 55 43 / 55%);
}

.cut-slit {
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  background: #e5372b;
  box-shadow: 0 0 8px rgb(229 55 43 / 75%);
  pointer-events: none;
}

.cut-slit.is-bottom {
  top: auto;
  bottom: 0;
}

.cut-slit.is-from-right {
  right: 0;
  left: auto;
}

.scissors-runner {
  position: absolute;
  top: -20px;
  left: -20px;
  z-index: 10;
  width: 40px;
  height: 40px;
  pointer-events: none;
  transform-style: preserve-3d;
}

.scissors-svg {
  display: block;
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 4px 6px rgb(0 0 0 / 55%));
}

.phase-card {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  max-width: calc(100% - 28px);
  padding: 8px 14px;
  border: 1px solid var(--line);
  background: rgb(11 10 9 / 90%);
  box-shadow: 4px 4px 0 rgb(0 0 0 / 45%);
  color: var(--ink);
  transform: translateX(-50%);
}

.phase-step {
  flex: none;
  padding: 3px 7px;
  background: var(--acid);
  color: var(--ink-dark);
  font-family: var(--font-type);
  font-size: 11px;
  font-weight: 700;
}

.phase-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.phase-copy strong {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.phase-copy span {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.25;
}

.cam-reset {
  flex: none;
  padding: 4px 8px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--acid);
  font-family: var(--font-type);
  font-size: 11px;
  cursor: pointer;
}

.cam-reset:hover {
  border-color: var(--acid);
}
</style>
