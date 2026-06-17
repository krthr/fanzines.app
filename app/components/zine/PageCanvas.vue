<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, watch } from 'vue'
import type { CSSProperties } from 'vue'
import 'konva/lib/shapes/Image'
import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import 'konva/lib/shapes/Transformer'
import { Image as VImage, Layer as VLayer, Rect as VRect, Stage as VStage, Text as VText, Transformer as VTransformer } from 'vue-konva/core'
import type { Node as KonvaNode } from 'konva/lib/Node'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import type { Box, Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer'
import type { ImageElement, TextElement, ZineElement } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZineImageImport } from '~/composables/useZineImageImport.client'
import { useZineDragState } from '~/composables/useZineDragState.client'
import { PAGE_H, PAGE_W, clampToPage } from '~/utils/zineLayout'

type KonvaEvent = {
  target: KonvaNode
  cancelBubble: boolean
}

const {
  state,
  currentPageElements,
  selectElement,
  updateElement
} = useZineStore()

const { processImageFiles } = useZineImageImport()
const { resetDrag } = useZineDragState()

const containerRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const stageRef = ref<{ getNode: () => KonvaStage } | null>(null)
const transformerRef = ref<{ getNode: () => KonvaTransformer } | null>(null)
const size = reactive({ width: 0, height: 0 })
const loadedImages = shallowReactive(new Map<string, HTMLImageElement>())
const failedImages = shallowReactive(new Set<string>())
const editingTextId = ref<string | null>(null)
const editingTextValue = ref('')
const textEditorRef = ref<HTMLTextAreaElement | null>(null)
const isDraggingElement = ref(false)
const hoveredElementId = ref<string | null>(null)
const isCanvasDragOver = ref(false)
let canvasDragDepth = 0

let resizeObserver: ResizeObserver | null = null

const selectedId = computed(() => state.value.selectedElementId)
const selectedElement = computed(() => selectedId.value ? state.value.elements[selectedId.value] ?? null : null)
const editingTextElement = computed(() => {
  const element = editingTextId.value ? state.value.elements[editingTextId.value] ?? null : null
  return element?.type === 'text' ? element : null
})
const hoveredElement = computed(() => hoveredElementId.value ? state.value.elements[hoveredElementId.value] ?? null : null)
const isEmptyPage = computed(() => currentPageElements.value.length === 0)
const activeImageSources = computed(() => new Set(Object.values(state.value.elements)
  .filter((element): element is ImageElement => element.type === 'image')
  .map((element) => element.src)))

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
  stroke: '#070706',
  strokeWidth: 2,
  name: 'page-background',
  listening: true
}))

const canvasCursor = computed(() => {
  const movableHoveredElement = hoveredElement.value && !hoveredElement.value.locked && editingTextId.value !== hoveredElement.value.id
  const movableSelectedElement = selectedElement.value && !selectedElement.value.locked && !editingTextId.value

  if (isDraggingElement.value) return 'grabbing'
  if (movableHoveredElement || movableSelectedElement) return 'grab'
  return 'default'
})

const textEditorStyle = computed<CSSProperties>(() => {
  const element = editingTextElement.value
  const container = containerRef.value
  const stage = stageRef.value?.getNode()

  if (!element || !container || !stage) return {}

  const stageRect = stage.container().getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const canvasScale = scale.value

  return {
    left: `${stageRect.left - containerRect.left + container.scrollLeft + element.x * canvasScale}px`,
    top: `${stageRect.top - containerRect.top + container.scrollTop + element.y * canvasScale}px`,
    width: `${Math.max(80, element.width * canvasScale)}px`,
    minHeight: `${Math.max(40, element.height * canvasScale)}px`,
    color: element.fill,
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize * canvasScale}px`,
    fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: element.fontStyle === 'bold' ? 700 : 400,
    lineHeight: String(element.lineHeight),
    opacity: element.opacity,
    textAlign: element.align,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'top left'
  }
})

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
    borderStroke: '#f23d25',
    anchorStroke: '#070706',
    anchorFill: '#e7ff36',
    boundBoxFunc: (_oldBox: Box, newBox: Box) => {
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
    draggable: !element.locked && editingTextId.value !== element.id
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
    fill: failedImages.has(element.src) ? '#ffd3ca' : '#fff6c8',
    stroke: failedImages.has(element.src) ? '#f23d25' : '#070706',
    dash: [12, 8],
    draggable: !element.locked && editingTextId.value !== element.id
  }
}

function textConfig(element: TextElement) {
  const isEditing = editingTextId.value === element.id

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
    visible: !isEditing,
    listening: !isEditing,
    draggable: !element.locked && !isEditing
  }
}

function setStageCursor(cursor: string) {
  const stage = stageRef.value?.getNode()
  if (!stage) return
  stage.container().style.cursor = cursor
}

function resetStageCursor() {
  setStageCursor('')
}

function getPagePointFromClient(clientX: number, clientY: number) {
  const stage = stageRef.value?.getNode()
  if (!stage) return null

  const rect = stage.container().getBoundingClientRect()

  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return null
  }

  return {
    x: (clientX - rect.left) / scale.value,
    y: (clientY - rect.top) / scale.value
  }
}

function isPointInsideElement(element: ZineElement, point: { x: number, y: number }) {
  const radians = -(element.rotation * Math.PI) / 180
  const dx = point.x - element.x
  const dy = point.y - element.y
  const localX = dx * Math.cos(radians) - dy * Math.sin(radians)
  const localY = dx * Math.sin(radians) + dy * Math.cos(radians)

  return localX >= 0 && localX <= element.width && localY >= 0 && localY <= element.height
}

function elementAtPagePoint(point: { x: number, y: number }) {
  return [...currentPageElements.value]
    .reverse()
    .find((element) => isPointInsideElement(element, point)) ?? null
}

function handleCanvasMouseMove(event: MouseEvent) {
  if (isDraggingElement.value) return

  const point = getPagePointFromClient(event.clientX, event.clientY)
  const element = point ? elementAtPagePoint(point) : null
  hoveredElementId.value = element?.id ?? null

  if (element && !element.locked && editingTextId.value !== element.id) {
    setStageCursor('grab')
  } else {
    resetStageCursor()
  }
}

function handleCanvasMouseLeave() {
  hoveredElementId.value = null

  if (!isDraggingElement.value) {
    resetStageCursor()
  }
}

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (files.length === 0) return

  await processImageFiles(files, { inputMethod: 'file_picker' })
}

function handleStagePointer(event: KonvaEvent) {
  const stage = event.target.getStage()
  const clickedTransformer = event.target.getParent()?.className === 'Transformer'

  if (clickedTransformer) return

  if (event.target === stage || event.target.name() === 'page-background') {
    hoveredElementId.value = null
    resetStageCursor()
    if (isEmptyPage.value) {
      openFilePicker()
      return
    }
    selectElement(null)
  }
}

function handleStagePointerMove(event: KonvaEvent) {
  if (isDraggingElement.value) return

  const stage = event.target.getStage()
  const clickedTransformer = event.target.getParent()?.className === 'Transformer'

  if (event.target === stage || event.target.name() === 'page-background' || clickedTransformer) {
    resetStageCursor()
    return
  }

  const elementId = event.target.id()
  const element = elementId ? state.value.elements[elementId] ?? null : null

  if (element && !element.locked && editingTextId.value !== element.id) {
    setStageCursor('grab')
  } else {
    resetStageCursor()
  }
}

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes('Files'))
}

function handleCanvasDragEnter(event: DragEvent) {
  if (!isFileDrag(event)) return
  canvasDragDepth += 1
  isCanvasDragOver.value = true
}

function handleCanvasDragOver(event: DragEvent) {
  if (!isFileDrag(event)) return
  event.preventDefault()
}

function handleCanvasDragLeave(event: DragEvent) {
  if (!isFileDrag(event)) return
  canvasDragDepth = Math.max(0, canvasDragDepth - 1)
  if (canvasDragDepth === 0) isCanvasDragOver.value = false
}

function handleCanvasDrop(event: DragEvent) {
  if (!isFileDrag(event)) return
  event.preventDefault()
  event.stopPropagation()
  canvasDragDepth = 0
  isCanvasDragOver.value = false
  resetDrag()
  const files = Array.from(event.dataTransfer?.files ?? [])
  void processImageFiles(files, { inputMethod: 'drag_drop', dropTarget: 'canvas' })
}

function handleElementPointer(element: ZineElement, event: KonvaEvent) {
  event.cancelBubble = true
  if (!element.locked && editingTextId.value !== element.id) {
    hoveredElementId.value = element.id
    setStageCursor('grab')
  }
  selectElement(element.id)
}

function handleElementPointerEnter(element: ZineElement) {
  if (!element.locked && editingTextId.value !== element.id) {
    hoveredElementId.value = element.id
    setStageCursor('grab')
  }
}

function handleElementPointerLeave() {
  hoveredElementId.value = null

  if (!isDraggingElement.value) {
    resetStageCursor()
  }
}

function handleDragStart(element: ZineElement) {
  if (element.locked) return
  isDraggingElement.value = true
  setStageCursor('grabbing')
}

function handleDragEnd(element: ZineElement, event: KonvaEvent) {
  const node = event.target
  updateElement(element.id, {
    x: clampToPage(node.x(), PAGE_W),
    y: clampToPage(node.y(), PAGE_H)
  })
  isDraggingElement.value = false
  setStageCursor(element.locked ? 'default' : 'grab')
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

    const selectedNode = selectedId.value && !editingTextId.value ? stage.findOne(`#${selectedId.value}`) : null
    transformerNode.nodes(selectedNode ? [selectedNode] : [])
    transformerNode.getLayer()?.batchDraw()

    if (editingTextId.value) {
      resetStageCursor()
    } else if (selectedElement.value && !selectedElement.value.locked) {
      setStageCursor('grab')
    } else {
      resetStageCursor()
    }
  })
}

function updateTextEditorHeight() {
  nextTick(() => {
    const editor = textEditorRef.value
    const element = editingTextElement.value

    if (!editor || !element) return

    editor.style.height = 'auto'
    editor.style.height = `${Math.max(element.height * scale.value, editor.scrollHeight)}px`
  })
}

function startEditingText(element: TextElement) {
  if (element.locked) return

  selectElement(element.id)
  editingTextId.value = element.id
  editingTextValue.value = element.text
  hoveredElementId.value = null
  resetStageCursor()
  updateTransformer()

  nextTick(() => {
    const editor = textEditorRef.value
    if (!editor) return

    editor.focus()
    editor.setSelectionRange(editor.value.length, editor.value.length)
    updateTextEditorHeight()
  })
}

function commitTextEdit() {
  const element = editingTextElement.value

  if (element) {
    updateElement(element.id, {
      text: editingTextValue.value
    })
  }

  editingTextId.value = null
  editingTextValue.value = ''
  hoveredElementId.value = null
  updateTransformer()
}

function cancelTextEdit() {
  editingTextId.value = null
  editingTextValue.value = ''
  hoveredElementId.value = null
  updateTransformer()
}

function handleTextEditRequest(element: TextElement, event: KonvaEvent) {
  event.cancelBubble = true
  startEditingText(element)
}

function handleTextEditorInput(event: Event) {
  editingTextValue.value = (event.target as HTMLTextAreaElement).value
  updateTextEditorHeight()
}

function handleTextEditorKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    cancelTextEdit()
    return
  }

  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    event.stopPropagation()
    commitTextEdit()
  }
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  return element?.matches('input, textarea, select, [contenteditable="true"]') ?? false
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || isTypingTarget(event.target)) return

  const element = selectedElement.value
  if (element?.type !== 'text' || element.locked) return

  event.preventDefault()
  startEditingText(element)
}

function loadCanvasImages() {
  pruneCanvasImageMaps()
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

function pruneCanvasImageMaps() {
  const activeSources = activeImageSources.value

  for (const src of loadedImages.keys()) {
    if (!activeSources.has(src)) {
      loadedImages.delete(src)
    }
  }

  for (const src of failedImages.keys()) {
    if (!activeSources.has(src)) {
      failedImages.delete(src)
    }
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
  window.addEventListener('keydown', handleWindowKeydown)
  loadCanvasImages()
  updateTransformer()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('keydown', handleWindowKeydown)
})

watch(
  () => [
    state.value.selectedPageId,
    selectedId.value,
    currentPageElements.value.length,
    currentPageElements.value.map((element) => element.id).join(','),
    editingTextId.value,
    [...activeImageSources.value].join(',')
  ],
  () => {
    pruneCanvasImageMaps()
    loadCanvasImages()
    updateTransformer()
  },
  { flush: 'post' }
)
</script>

<template>
  <div
    ref="containerRef"
    class="zine-canvas-wrap relative flex h-full min-h-[420px] items-center justify-center overflow-auto p-4 lg:p-8"
    :class="{ 'zine-canvas-dragover': isCanvasDragOver, 'zine-canvas-empty': isEmptyPage }"
    :style="{ cursor: canvasCursor }"
    @dragenter="handleCanvasDragEnter"
    @dragover="handleCanvasDragOver"
    @dragleave="handleCanvasDragLeave"
    @drop="handleCanvasDrop"
    @mouseleave="handleCanvasMouseLeave"
    @mousemove="handleCanvasMouseMove"
  >
    <VStage
      ref="stageRef"
      :config="stageConfig"
      class="shadow-[var(--zine-shadow)]"
      @mousedown="handleStagePointer"
      @mousemove="handleStagePointerMove"
      @touchstart="handleStagePointer"
    >
      <VLayer :config="layerConfig">
        <VRect :config="backgroundConfig" />

        <template v-for="element in currentPageElements" :key="element.id">
          <VImage
            v-if="element.type === 'image' && loadedImages.has(element.src)"
            :config="imageConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @mouseenter="() => handleElementPointerEnter(element)"
            @mouseleave="handleElementPointerLeave"
            @dragstart="() => handleDragStart(element)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
          <VRect
            v-else-if="element.type === 'image'"
            :config="imageFallbackConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @mouseenter="() => handleElementPointerEnter(element)"
            @mouseleave="handleElementPointerLeave"
            @dragstart="() => handleDragStart(element)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
          <VText
            v-else
            :config="textConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @mouseenter="() => handleElementPointerEnter(element)"
            @mouseleave="handleElementPointerLeave"
            @dragstart="() => handleDragStart(element)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
            @dblclick="(event: KonvaEvent) => handleTextEditRequest(element, event)"
            @dbltap="(event: KonvaEvent) => handleTextEditRequest(element, event)"
          />
        </template>

        <VTransformer ref="transformerRef" :config="transformerConfig" />
      </VLayer>
    </VStage>

    <textarea
      v-if="editingTextElement"
      ref="textEditorRef"
      aria-label="Editar texto del fanzine"
      class="zine-inline-text-editor"
      :style="textEditorStyle"
      :value="editingTextValue"
      @blur="commitTextEdit"
      @input="handleTextEditorInput"
      @keydown="handleTextEditorKeydown"
    />

    <div v-if="isEmptyPage" class="zine-canvas-empty-hint" :class="{ 'zine-canvas-empty-hint-active': isCanvasDragOver }" aria-hidden="true">
      <UIcon name="i-lucide-image-plus" class="zine-canvas-empty-hint-icon" />
      <p class="zine-canvas-empty-hint-title">Haz clic o arrastra</p>
      <p class="zine-canvas-empty-hint-sub">imágenes para añadir al panel</p>
    </div>

    <input
      ref="fileInput"
      class="hidden"
      type="file"
      accept="image/*"
      multiple
      @change="handleFileChange"
    >
  </div>
</template>
