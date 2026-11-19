<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PageId, ZineElement } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { renderPageCanvas } from '~/utils/renderPage.client'

// A live, read-only render of one page: sidebar thumbnails, the mobile strip
// and the facing page on the canvas.
const props = defineProps<{
  pageId: PageId
  // Width in CSS pixels.
  width: number
}>()

const RENDER_DELAY_MS = 120
const MAX_PIXEL_RATIO = 2

const { state } = useZineStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

let isMounted = false
let renderVersion = 0
let renderTimeoutId: number | null = null

const elements = computed(() => state.value.pageElementIds[props.pageId]
  .map((id) => state.value.elements[id])
  .filter((element): element is ZineElement => Boolean(element)))

const renderKey = computed(() => `${props.width}|${JSON.stringify(elements.value)}`)

async function render() {
  const version = ++renderVersion

  try {
    const rendered = await renderPageCanvas(elements.value, {
      width: props.width,
      pixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    })
    const canvas = canvasRef.value

    if (!rendered || !canvas || version !== renderVersion) return

    canvas.width = rendered.width
    canvas.height = rendered.height
    canvas.getContext('2d')?.drawImage(rendered, 0, 0)
  } catch {
    // An image that fails to load leaves the previous render in place.
  }
}

function scheduleRender(delay = RENDER_DELAY_MS) {
  if (!isMounted) return

  if (renderTimeoutId !== null) {
    window.clearTimeout(renderTimeoutId)
  }

  renderTimeoutId = window.setTimeout(() => {
    renderTimeoutId = null
    void render()
  }, delay)
}

onMounted(() => {
  isMounted = true
  scheduleRender(0)
})

onBeforeUnmount(() => {
  isMounted = false
  renderVersion++

  if (renderTimeoutId !== null) {
    window.clearTimeout(renderTimeoutId)
  }
})

watch(renderKey, () => scheduleRender(), { flush: 'post' })
</script>

<template>
  <canvas ref="canvasRef" class="page-render" aria-hidden="true" />
</template>

<style scoped>
.page-render {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
}
</style>
