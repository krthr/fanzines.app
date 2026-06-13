<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, watch } from 'vue'
import type Konva from 'konva'
import type { ImageElement, TextElement, ZineElement } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { PAGE_H, PAGE_W, clampToPage } from '~/utils/zineLayout'

type KonvaEvent = {
  target: Konva.Node
  cancelBubble: boolean
}

const {
  state,
  currentPageElements,
  selectElement,
  updateElement
} = useZineStore()

const containerRef = ref<HTMLElement | null>(null)
const stageRef = ref<{ getNode: () => Konva.Stage } | null>(null)
const transformerRef = ref<{ getNode: () => Konva.Transformer } | null>(null)
const size = reactive({ width: 0, height: 0 })
const loadedImages = shallowReactive(new Map<string, HTMLImageElement>())
const failedImages = shallowReactive(new Set<string>())

let resizeObserver: ResizeObserver | null = null

const selectedId = computed(() => state.value.selectedElementId)
const selectedElement = computed(() => selectedId.value ? state.value.elements[selectedId.value] ?? null : null)

const scale = computed(() => {
  const widthScale = size.width > 0 ? size.width / PAGE_W : 0.5
  const heightScale = size.height > 0 ? size.height / PAGE_H : widthScale
  return Math.max(0.18, Math.min(widthScale, heightScale, 0.72))
})

const stageConfig = computed(() => ({
  width: Math.round(PAGE_W * scale.value),
  height: Math.round(PAGE_H * scale.value)
}))

const layerConfig = computed(() => ({
  scaleX: scale.value,
  scaleY: scale.value
}))

const backgroundConfig = computed(() => ({
  x: 0,
  y: 0,
  width: PAGE_W,
  height: PAGE_H,
  fill: '#ffffff',
  stroke: '#d8d0c4',
  strokeWidth: 2,
  name: 'page-background',
  listening: true
}))

const safeMarginConfig = computed(() => ({
  x: PAGE_W * 0.07,
  y: PAGE_H * 0.05,
  width: PAGE_W * 0.86,
  height: PAGE_H * 0.9,
  stroke: '#0f8f8c',
  strokeWidth: 1,
  dash: [12, 10],
  opacity: 0.28,
  listening: false
}))

const transformerConfig = computed(() => {
  const element = selectedElement.value
  const isText = element?.type === 'text'

  return {
    rotateEnabled: true,
    keepRatio: !isText,
    enabledAnchors: isText
      ? ['middle-left', 'middle-right']
      : ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    anchorSize: 10,
    anchorCornerRadius: 2,
    borderStroke: '#0f8f8c',
    anchorStroke: '#0f8f8c',
    anchorFill: '#ffffff',
    boundBoxFunc: (_oldBox: Konva.Box, newBox: Konva.Box) => {
      if (newBox.width < 20 || newBox.height < 20) return _oldBox
      return newBox
    }
  }
})

function imageConfig(element: ImageElement) {
  return {
    id: element.id,
    name: 'zine-element',
    image: loadedImages.get(element.src),
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: !element.locked
  }
}

function imageFallbackConfig(element: ImageElement) {
  return {
    id: element.id,
    name: 'zine-element',
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    fill: failedImages.has(element.src) ? '#f7d5cf' : '#f1ece4',
    stroke: failedImages.has(element.src) ? '#a3362b' : '#d8d0c4',
    dash: [12, 8],
    draggable: !element.locked
  }
}

function textConfig(element: TextElement) {
  return {
    id: element.id,
    name: 'zine-element',
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    text: element.text,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontStyle: element.fontStyle,
    fill: element.fill,
    align: element.align,
    lineHeight: element.lineHeight,
    wrap: 'word',
    draggable: !element.locked
  }
}

function handleStagePointer(event: KonvaEvent) {
  const stage = event.target.getStage()
  const clickedTransformer = event.target.getParent()?.className === 'Transformer'

  if (clickedTransformer) return

  if (event.target === stage || event.target.name() === 'page-background') {
    selectElement(null)
  }
}

function handleElementPointer(element: ZineElement, event: KonvaEvent) {
  event.cancelBubble = true
  selectElement(element.id)
}

function handleDragEnd(element: ZineElement, event: KonvaEvent) {
  const node = event.target
  updateElement(element.id, {
    x: clampToPage(node.x(), PAGE_W),
    y: clampToPage(node.y(), PAGE_H)
  })
}

function handleTransformEnd(element: ZineElement, event: KonvaEvent) {
  const node = event.target
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()

  if (element.type === 'image') {
    updateElement(element.id, {
      x: clampToPage(node.x(), PAGE_W),
      y: clampToPage(node.y(), PAGE_H),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation()
    })
  } else {
    updateElement(element.id, {
      x: clampToPage(node.x(), PAGE_W),
      y: clampToPage(node.y(), PAGE_H),
      width: Math.max(80, node.width() * scaleX),
      rotation: node.rotation()
    })
  }

  node.scaleX(1)
  node.scaleY(1)
  updateTransformer()
}

function updateTransformer() {
  nextTick(() => {
    const transformerNode = transformerRef.value?.getNode()
    const stage = stageRef.value?.getNode()

    if (!transformerNode || !stage) return

    const selectedNode = selectedId.value ? stage.findOne(`#${selectedId.value}`) : null
    transformerNode.nodes(selectedNode ? [selectedNode] : [])
    transformerNode.getLayer()?.batchDraw()
  })
}

function loadCanvasImages() {
  const images = currentPageElements.value.filter((element): element is ImageElement => element.type === 'image')

  for (const element of images) {
    if (loadedImages.has(element.src) || failedImages.has(element.src)) continue

    const image = new Image()
    image.onload = () => {
      loadedImages.set(element.src, image)
      failedImages.delete(element.src)
      updateTransformer()
      stageRef.value?.getNode().batchDraw()
    }
    image.onerror = () => {
      failedImages.add(element.src)
      updateTransformer()
    }
    image.src = element.src
  }
}

onMounted(() => {
  if (!containerRef.value) return

  resizeObserver = new ResizeObserver(([entry]) => {
    const rect = entry.contentRect
    size.width = rect.width
    size.height = rect.height
  })
  resizeObserver.observe(containerRef.value)
  loadCanvasImages()
  updateTransformer()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [
    state.value.selectedPageId,
    selectedId.value,
    currentPageElements.value.length,
    currentPageElements.value.map((element) => element.id).join(',')
  ],
  () => {
    loadCanvasImages()
    updateTransformer()
  },
  { flush: 'post' }
)
</script>

<template>
  <div ref="containerRef" class="zine-canvas-wrap flex h-full min-h-[420px] items-center justify-center overflow-auto p-4 lg:p-8">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      class="shadow-[var(--zine-shadow)]"
      @mousedown="handleStagePointer"
      @touchstart="handleStagePointer"
    >
      <v-layer :config="layerConfig">
        <v-rect :config="backgroundConfig" />
        <v-rect :config="safeMarginConfig" />

        <template v-for="element in currentPageElements" :key="element.id">
          <v-image
            v-if="element.type === 'image' && loadedImages.has(element.src)"
            :config="imageConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
          <v-rect
            v-else-if="element.type === 'image'"
            :config="imageFallbackConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
          <v-text
            v-else
            :config="textConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
        </template>

        <v-transformer ref="transformerRef" :config="transformerConfig" />
      </v-layer>
    </v-stage>
  </div>
</template>
