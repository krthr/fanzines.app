<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { PageId } from '~/types/zine'

// PROTOTYPE: Interactive 4-leaf 3D pocket fanzine built with CSS 3D + spring physics.
// Supports continuous swipe-to-flip leaf scrubbing, velocity flicks, 360° free orbit
// rotation, dynamic directional shading, cast turn shadows, and grounded desk shadow.

export type BookletInteractionMode = 'swipe-first' | 'orbit-first'
export type BookletPaperStyle = 'clean' | 'matte' | 'newsprint'

export type BookletTelemetry = {
  progress: number
  spreadIndex: number
  rotX: number
  rotY: number
  zoom: number
  gesture: 'idle' | 'flipping' | 'orbiting'
}

type LeafSpec = {
  index: number
  front: PageId
  back: PageId
}

const LEAVES: readonly LeafSpec[] = [
  { index: 0, front: 'front-cover', back: 'p1' },
  { index: 1, front: 'p2', back: 'p3' },
  { index: 2, front: 'p4', back: 'p5' },
  { index: 3, front: 'p6', back: 'back-cover' }
] as const

const PANEL_ASPECT = 105 / 74.25 // A7 portrait ratio (≈ 1.4141)
const LEAF_GAP = 1.7 // px between stacked leaves

const props = withDefaults(defineProps<{
  textures: Record<PageId, string>
  hasContent: Record<PageId, boolean>
  pageLabels: Record<PageId, string>
  spread?: number
  interactionMode?: BookletInteractionMode
  paperStyle?: BookletPaperStyle
  showCornerHint?: boolean
  handheldRock?: boolean
  showFoldMarks?: boolean
  initialRotX?: number
  initialRotY?: number
  initialZoom?: number
  maxPageHeight?: number
}>(), {
  spread: 0,
  interactionMode: 'swipe-first',
  paperStyle: 'matte',
  showCornerHint: false,
  handheldRock: false,
  showFoldMarks: true,
  initialRotX: 14,
  initialRotY: -18,
  initialZoom: 1,
  maxPageHeight: 460
})

const emit = defineEmits<{
  'update:spread': [spread: number]
  'telemetry': [data: BookletTelemetry]
  'pageClick': [pageId: PageId]
}>()

const stageRef = ref<HTMLElement | null>(null)
const stageWidth = ref(680)
const stageHeight = ref(520)

// Animated live values (driven by damped spring loop)
const progress = ref(clamp(props.spread, 0, 4))
const rotX = ref(props.initialRotX)
const rotY = ref(props.initialRotY)
const zoom = ref(props.initialZoom)
const hoverEdge = ref<'left' | 'right' | null>(null)
const hoverPeel = ref(0) // -1 (left corner) .. 0 .. +1 (right corner)
const activeGesture = ref<'idle' | 'flipping' | 'orbiting'>('idle')

// Spring targets & velocities
let targetProgress = progress.value
let progressVel = 0
let targetRotX = rotX.value
let targetRotY = rotY.value
let rotXVel = 0
let rotYVel = 0
let targetZoom = zoom.value

let rafId: number | null = null
let lastFrameTime = 0

// Pointer interaction state
let pointerId: number | null = null
let pointerStartX = 0
let pointerStartY = 0
let pointerLastX = 0
let pointerLastY = 0
let pointerLastTime = 0
let pointerMoved = false
let pointerStartProgress = 0
let flipVelocity = 0
let dragKind: 'none' | 'flip' | 'orbit' = 'none'
let downOnBook = false
let downSide: 'left' | 'right' = 'right'

let resizeObserver: ResizeObserver | null = null

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

// Compute responsive panel dimensions that always fit comfortably in the stage
const pageH = computed(() => {
  const byHeight = Math.max(180, (stageHeight.value - 90) * 0.78)
  const byWidth = Math.max(140, ((stageWidth.value - 80) * 0.44) * PANEL_ASPECT)
  return Math.round(Math.min(props.maxPageHeight, byHeight, byWidth))
})

const pageW = computed(() => Math.round(pageH.value / PANEL_ASPECT))

const currentSpread = computed(() => clamp(Math.round(progress.value), 0, 4))

// Keep center of visual mass centered whether closed front, open spread, or closed back
const bookShiftX = computed(() => {
  const p = progress.value
  const half = pageW.value / 2
  if (p <= 1) return -half * (1 - p)
  if (p >= 3) return half * (p - 3)
  return 0
})

// Optional tactile handheld tilt while flipping a leaf
const rockY = computed(() => {
  if (!props.handheldRock) return 0
  const frac = progress.value - Math.floor(progress.value)
  return Math.sin(frac * Math.PI) * 8 * (flipVelocity >= 0 ? -1 : 1)
})

const rockZ = computed(() => {
  if (!props.handheldRock) return 0
  const frac = progress.value - Math.floor(progress.value)
  return Math.sin(frac * Math.PI) * -2.2
})

const paperTint = computed(() => {
  if (props.paperStyle === 'newsprint') return '#f0ebe0'
  if (props.paperStyle === 'matte') return '#faf8f4'
  return '#ffffff'
})

// Compute subtle dynamic lighting shade for a face based on its 3D orientation relative to
// an upper-left studio lamp, so leaves darken/brighten naturally as you flip and rotate.
function faceShadeOpacity(leafAngleDeg: number, isBack: boolean): number {
  const totalYawDeg = rotY.value + leafAngleDeg + (isBack ? 180 : 0)
  const yaw = (totalYawDeg * Math.PI) / 180
  const pitch = (rotX.value * Math.PI) / 180

  // Face normal in camera space
  const nx = Math.sin(yaw) * Math.cos(pitch)
  const ny = -Math.sin(pitch)
  const nz = Math.cos(yaw) * Math.cos(pitch)

  // Overhead studio key light (slightly top-left-front)
  const lx = -0.32
  const ly = -0.36
  const lz = 0.88
  const dot = clamp(nx * lx + ny * ly + nz * lz, -1, 1)

  // Map dot product to subtle realistic shadow opacity (0 = bright, 0.42 = deep turn shadow)
  return clamp((1 - Math.max(0, dot)) * 0.44, 0, 0.46)
}

function getLeafTurn(index: number) {
  let t = clamp(progress.value - index, 0, 1)

  // Smooth inviting hover peel on the top accessible outer corner (Variant C)
  if (props.showCornerHint && Math.abs(hoverPeel.value) > 0.002 && Math.abs(progress.value - Math.round(progress.value)) < 0.02) {
    const spreadIdx = Math.round(progress.value)
    if (hoverPeel.value > 0 && index === spreadIdx && spreadIdx < 4) {
      t = Math.max(t, hoverPeel.value * 0.075)
    } else if (hoverPeel.value < 0 && index === spreadIdx - 1 && spreadIdx > 0) {
      t = Math.min(t, 1 + hoverPeel.value * 0.075)
    }
  }

  return t
}

function leafStyle(index: number): CSSProperties {
  const t = getLeafTurn(index)
  const angle = -180 * t
  const zRight = (3 - index) * LEAF_GAP
  const zLeft = index * LEAF_GAP
  const lift = Math.sin(t * Math.PI) * 5
  const z = lerp(zRight, zLeft, t) + lift

  return {
    transform: `translateZ(${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`
  }
}

// Cast shadow from the currently turning leaf onto the page underneath it
function castShadowOpacity(index: number, side: 'front' | 'back'): number {
  if (side === 'front' && index > 0) {
    // Leaf above on right is leaf[index - 1]
    const upperT = getLeafTurn(index - 1)
    if (upperT > 0.01 && upperT < 0.99) {
      return clamp((1 - upperT) * Math.sin(upperT * Math.PI) * 0.55, 0, 0.42)
    }
  }
  if (side === 'back' && index < 3) {
    // Leaf landing onto left is leaf[index + 1]
    const nextT = getLeafTurn(index + 1)
    if (nextT > 0.01 && nextT < 0.99) {
      return clamp(nextT * Math.sin(nextT * Math.PI) * 0.55, 0, 0.42)
    }
  }
  return 0
}

function frontShadeStyle(index: number): CSSProperties {
  const angle = -180 * getLeafTurn(index)
  const shade = faceShadeOpacity(angle, false)
  const cast = castShadowOpacity(index, 'front')
  return {
    opacity: Math.min(0.6, shade + cast).toFixed(3)
  }
}

function backShadeStyle(index: number): CSSProperties {
  const angle = -180 * getLeafTurn(index)
  const shade = faceShadeOpacity(angle, true)
  const cast = castShadowOpacity(index, 'back')
  return {
    opacity: Math.min(0.6, shade + cast).toFixed(3)
  }
}

const assemblyStyle = computed<CSSProperties>(() => ({
  width: `${pageW.value}px`,
  height: `${pageH.value}px`,
  transform: [
    `scale(${zoom.value.toFixed(3)})`,
    `rotateX(${rotX.value.toFixed(2)}deg)`,
    `rotateY(${(rotY.value + rockY.value).toFixed(2)}deg)`,
    `rotateZ(${rockZ.value.toFixed(2)}deg)`,
    `translateX(${bookShiftX.value.toFixed(2)}px)`
  ].join(' ')
}))

// Grounded desk shadow expands smoothly as the zine opens from 1 panel to 2 panels
const deskShadowStyle = computed<CSSProperties>(() => {
  const p = progress.value
  const openFactor = p <= 1 ? p : p >= 3 ? 4 - p : 1
  const width = pageW.value * (1 + openFactor)
  const left = p <= 1 ? -pageW.value * p : p >= 3 ? -pageW.value : -pageW.value
  return {
    width: `${width.toFixed(1)}px`,
    height: `${pageH.value}px`,
    left: `${left.toFixed(1)}px`,
    transform: `translateZ(-22px) translateY(14px)`
  }
})

// ── Animation loop ──────────────────────────────────────────────────────────

function emitTelemetry() {
  emit('telemetry', {
    progress: progress.value,
    spreadIndex: currentSpread.value,
    rotX: rotX.value,
    rotY: rotY.value,
    zoom: zoom.value,
    gesture: activeGesture.value
  })
}

function ensureLoop() {
  if (rafId !== null) return
  lastFrameTime = performance.now()
  rafId = window.requestAnimationFrame(tick)
}

function tick(now: number) {
  const dt = Math.min(0.05, Math.max(0.004, (now - lastFrameTime) / 1000))
  lastFrameTime = now

  let moving = false

  if (dragKind !== 'flip') {
    const diff = targetProgress - progress.value
    const stiffness = 140
    const damping = 18
    progressVel += (diff * stiffness - progressVel * damping) * dt
    progress.value = clamp(progress.value + progressVel * dt, 0, 4)

    if (Math.abs(diff) > 0.0015 || Math.abs(progressVel) > 0.002) {
      moving = true
    } else {
      progress.value = targetProgress
      progressVel = 0
    }
  } else {
    moving = true
  }

  if (dragKind !== 'orbit') {
    // Apply smooth inertia after orbit release, or spring to target pose
    if (Math.abs(rotXVel) > 0.05 || Math.abs(rotYVel) > 0.05) {
      const decay = Math.exp(-6.5 * dt)
      targetRotX = clamp(targetRotX + rotXVel * dt, -75, 75)
      targetRotY = targetRotY + rotYVel * dt
      rotXVel *= decay
      rotYVel *= decay
      moving = true
    } else {
      rotXVel = 0
      rotYVel = 0
    }

    const dx = targetRotX - rotX.value
    const dy = targetRotY - rotY.value
    const dz = targetZoom - zoom.value
    const ease = 1 - Math.exp(-12 * dt)

    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05 || Math.abs(dz) > 0.002) {
      rotX.value += dx * ease
      rotY.value += dy * ease
      zoom.value += dz * ease
      moving = true
    } else {
      rotX.value = targetRotX
      rotY.value = targetRotY
      zoom.value = targetZoom
    }
  } else {
    moving = true
  }

  // Smooth corner hover-peel interpolation
  const targetPeel = activeGesture.value === 'idle'
    ? (hoverEdge.value === 'right' ? 1 : hoverEdge.value === 'left' ? -1 : 0)
    : 0
  const peelDiff = targetPeel - hoverPeel.value
  if (Math.abs(peelDiff) > 0.005) {
    hoverPeel.value += peelDiff * (1 - Math.exp(-14 * dt))
    moving = true
  } else {
    hoverPeel.value = targetPeel
  }

  emitTelemetry()

  if (moving) {
    rafId = window.requestAnimationFrame(tick)
  } else {
    rafId = null
  }
}

// ── Public controls ─────────────────────────────────────────────────────────

function goToSpread(index: number) {
  const next = clamp(Math.round(index), 0, 4)
  targetProgress = next
  emit('update:spread', next)
  ensureLoop()
}

function flipBy(delta: -1 | 1) {
  goToSpread(Math.round(targetProgress) + delta)
}

function setPose(nextRotX: number, nextRotY: number, nextZoom = zoom.value) {
  rotXVel = 0
  rotYVel = 0
  targetRotX = clamp(nextRotX, -75, 75)
  targetRotY = nextRotY
  targetZoom = clamp(nextZoom, 0.65, 1.65)
  ensureLoop()
}

function resetCamera() {
  setPose(props.initialRotX, props.initialRotY, props.initialZoom)
}

defineExpose({
  goToSpread,
  flipBy,
  setPose,
  resetCamera
})

watch(() => props.spread, (next) => {
  if (typeof next !== 'number') return
  const clamped = clamp(next, 0, 4)
  if (Math.abs(clamped - targetProgress) > 0.001 && dragKind !== 'flip') {
    targetProgress = clamped
    ensureLoop()
  }
})

// ── Pointer gestures (swipe to flip + free 360° orbit) ──────────────────────

function isPointerOnBook(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-book-leaf]'))
}

function handlePointerDown(event: PointerEvent) {
  if (event.button === 1) return

  const stage = stageRef.value
  if (!stage) return

  pointerId = event.pointerId
  stage.setPointerCapture(event.pointerId)

  pointerStartX = event.clientX
  pointerStartY = event.clientY
  pointerLastX = event.clientX
  pointerLastY = event.clientY
  pointerLastTime = performance.now()
  pointerMoved = false
  pointerStartProgress = progress.value
  flipVelocity = 0
  rotXVel = 0
  rotYVel = 0

  downOnBook = isPointerOnBook(event.target)
  const rect = stage.getBoundingClientRect()
  downSide = event.clientX < rect.left + rect.width / 2 ? 'left' : 'right'

  // Right-click or Shift always orbits; otherwise honor the variant's interactionMode.
  const forceOrbit = event.button === 2 || event.shiftKey
  if (forceOrbit) {
    dragKind = 'orbit'
  } else if (props.interactionMode === 'orbit-first') {
    dragKind = 'orbit'
  } else {
    // swipe-first: dragging on the book flips leaves, dragging outside the book orbits 360°
    dragKind = downOnBook ? 'flip' : 'orbit'
  }

  activeGesture.value = dragKind === 'flip' ? 'flipping' : 'orbiting'
  ensureLoop()
}

function handlePointerMove(event: PointerEvent) {
  const stage = stageRef.value
  if (!stage) return

  // Update corner hover peel when idle
  if (pointerId === null) {
    const prev = hoverEdge.value
    if (props.showCornerHint && isPointerOnBook(event.target)) {
      const rect = stage.getBoundingClientRect()
      hoverEdge.value = event.clientX >= rect.left + rect.width / 2 ? 'right' : 'left'
    } else {
      hoverEdge.value = null
    }
    if (hoverEdge.value !== prev) ensureLoop()
    return
  }

  if (event.pointerId !== pointerId) return

  const now = performance.now()
  const dt = Math.max(0.008, (now - pointerLastTime) / 1000)
  const dx = event.clientX - pointerLastX
  const dy = event.clientY - pointerLastY
  const totalDx = event.clientX - pointerStartX
  const totalDy = event.clientY - pointerStartY

  if (Math.hypot(totalDx, totalDy) > 6) {
    pointerMoved = true
  }

  // In swipe-first mode, if the user starts dragging strongly vertically on the book,
  // smoothly promote to orbit so they can tilt the zine intuitively without hunting for empty space!
  if (
    props.interactionMode === 'swipe-first'
    && dragKind === 'flip'
    && Math.abs(totalDy) > 22
    && Math.abs(totalDy) > Math.abs(totalDx) * 1.45
    && Math.abs(progress.value - pointerStartProgress) < 0.14
  ) {
    dragKind = 'orbit'
    activeGesture.value = 'orbiting'
    targetProgress = Math.round(pointerStartProgress)
  }

  if (dragKind === 'flip') {
    // Invert drag direction when viewing from behind (|rotY mod 360| between 90° and 270°)
    const normY = (((rotY.value % 360) + 540) % 360) - 180
    const facingBack = Math.abs(normY) > 90
    const dir = facingBack ? 1 : -1
    const scrubWidth = Math.max(180, pageW.value * 1.15)
    const next = clamp(pointerStartProgress + (dir * totalDx) / scrubWidth, 0, 4)

    flipVelocity = (next - progress.value) / dt
    progress.value = next
    targetProgress = next
  } else if (dragKind === 'orbit') {
    const yawDelta = dx * 0.45
    const pitchDelta = -dy * 0.35

    rotY.value += yawDelta
    rotX.value = clamp(rotX.value + pitchDelta, -75, 75)
    targetRotY = rotY.value
    targetRotX = rotX.value

    rotYVel = clamp(yawDelta / dt, -260, 260)
    rotXVel = clamp(pitchDelta / dt, -180, 180)
  }

  pointerLastX = event.clientX
  pointerLastY = event.clientY
  pointerLastTime = now
  emitTelemetry()
}

function finishPointer(event: PointerEvent) {
  if (pointerId === null || event.pointerId !== pointerId) return

  const stage = stageRef.value
  if (stage?.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId)
  }

  const wasFlip = dragKind === 'flip'
  pointerId = null
  dragKind = 'none'
  activeGesture.value = 'idle'

  if (wasFlip) {
    if (!pointerMoved) {
      // Tap on right edge flips forward; tap on left edge flips backward
      const delta = downSide === 'right' ? 1 : -1
      const next = clamp(Math.round(pointerStartProgress) + delta, 0, 4)
      targetProgress = next
      emit('update:spread', next)
    } else {
      // Velocity-projected snap to nearest spread
      const projected = progress.value + clamp(flipVelocity * 0.16, -0.55, 0.55)
      const snapped = clamp(Math.round(projected), 0, 4)
      targetProgress = snapped
      progressVel = clamp(flipVelocity * 0.45, -8, 8)
      emit('update:spread', snapped)
    }
  } else if (!pointerMoved && downOnBook) {
    // In orbit-first mode, a clean tap on a leaf emits pageClick or flips cleanly
    const faceEl = (event.target as Element | null)?.closest<HTMLElement>('[data-page-id]')
    const pageId = faceEl?.dataset.pageId as PageId | undefined
    if (pageId) emit('pageClick', pageId)
  }

  ensureLoop()
}

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = -event.deltaY * 0.0012
  targetZoom = clamp(targetZoom + delta, 0.65, 1.65)
  ensureLoop()
}

function handleDoubleClick() {
  resetCamera()
}

onMounted(() => {
  const el = stageRef.value
  if (el) {
    const sync = () => {
      stageWidth.value = el.clientWidth || 680
      stageHeight.value = el.clientHeight || 520
    }
    sync()
    resizeObserver = new ResizeObserver(sync)
    resizeObserver.observe(el)
  }
  emitTelemetry()
})

onBeforeUnmount(() => {
  if (rafId !== null) window.cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="stageRef"
    class="book-stage"
    :class="[`is-${activeGesture}`, `mode-${interactionMode}`]"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="finishPointer"
    @pointercancel="finishPointer"
    @pointerleave="() => { if (hoverEdge !== null) { hoverEdge = null; ensureLoop() } }"
    @wheel.prevent="handleWheel"
    @dblclick="handleDoubleClick"
    @contextmenu.prevent
  >
    <div class="scene">
      <div class="book-assembly" :style="assemblyStyle">
        <!-- Grounded desk shadow -->
        <div class="desk-shadow" :style="deskShadowStyle" aria-hidden="true" />

        <!-- Subtle 3D spine strip visible when orbiting 360° -->
        <div class="spine-strip" aria-hidden="true" />

        <!-- 4 physical leaves -->
        <div
          v-for="leaf in LEAVES"
          :key="leaf.index"
          class="leaf"
          data-book-leaf
          :style="leafStyle(leaf.index)"
        >
          <!-- Front face (right-hand side before turning) -->
          <div
            class="face is-front"
            :data-page-id="leaf.front"
            :style="{ background: paperTint }"
          >
            <img
              v-if="textures[leaf.front]"
              :src="textures[leaf.front]"
              :alt="pageLabels[leaf.front]"
              class="face-img"
              draggable="false"
            >
            <div v-if="!hasContent[leaf.front]" class="blank-stamp" aria-hidden="true">
              <span class="blank-code">{{ pageLabels[leaf.front] }}</span>
              <span class="blank-hint">74 × 105 mm</span>
            </div>
            <div v-if="showFoldMarks" class="gutter-shadow is-left" aria-hidden="true" />
            <div v-if="showFoldMarks" class="top-crease" aria-hidden="true" />
            <div class="face-lighting" :style="frontShadeStyle(leaf.index)" aria-hidden="true" />
          </div>

          <!-- Back face (left-hand side after turning) -->
          <div
            class="face is-back"
            :data-page-id="leaf.back"
            :style="{ background: paperTint }"
          >
            <img
              v-if="textures[leaf.back]"
              :src="textures[leaf.back]"
              :alt="pageLabels[leaf.back]"
              class="face-img"
              draggable="false"
            >
            <div v-if="!hasContent[leaf.back]" class="blank-stamp" aria-hidden="true">
              <span class="blank-code">{{ pageLabels[leaf.back] }}</span>
              <span class="blank-hint">74 × 105 mm</span>
            </div>
            <div v-if="showFoldMarks" class="gutter-shadow is-right" aria-hidden="true" />
            <div v-if="showFoldMarks" class="top-crease" aria-hidden="true" />
            <div class="face-lighting" :style="backShadeStyle(leaf.index)" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 280px;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.book-stage.is-flipping,
.book-stage.is-orbiting {
  cursor: grabbing;
}

.scene {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  perspective: 1450px;
  perspective-origin: 50% 48%;
}

.book-assembly {
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
}

.desk-shadow {
  position: absolute;
  top: 0;
  background: rgb(0 0 0 / 55%);
  filter: blur(26px);
  pointer-events: none;
  transform-style: preserve-3d;
}

.spine-strip {
  position: absolute;
  top: 0;
  left: -3px;
  width: 6px;
  height: 100%;
  background: linear-gradient(to right, #d6d0c4, #f2ede3 45%, #c5beb2);
  transform: translateZ(2.5px) rotateY(90deg);
  pointer-events: none;
}

.leaf {
  position: absolute;
  inset: 0;
  transform-origin: left center;
  transform-style: preserve-3d;
  will-change: transform;
}

.face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border: 1px solid rgb(11 10 9 / 16%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 35%);
}

.face.is-front {
  transform: translateZ(0.4px);
}

.face.is-back {
  transform: rotateY(180deg) translateZ(0.4px);
}

.face-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
}

.blank-stamp {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  color: rgb(11 10 9 / 28%);
  text-align: center;
  pointer-events: none;
}

.blank-code {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.blank-hint {
  font-family: var(--font-type);
  font-size: 11px;
}

.gutter-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  pointer-events: none;
}

.gutter-shadow.is-left {
  left: 0;
  background: linear-gradient(to right, rgb(11 10 9 / 24%), rgb(11 10 9 / 7%) 38%, transparent);
}

.gutter-shadow.is-right {
  right: 0;
  background: linear-gradient(to left, rgb(11 10 9 / 24%), rgb(11 10 9 / 7%) 38%, transparent);
}

/* Subtle folded-top-sheet ridge that characterizes a single-sheet A4 zine */
.top-crease {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(to bottom, rgb(11 10 9 / 12%), transparent);
  pointer-events: none;
}

.face-lighting {
  position: absolute;
  inset: 0;
  background: #0b0a09;
  pointer-events: none;
}
</style>
