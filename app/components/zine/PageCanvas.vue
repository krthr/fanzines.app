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
import { DEFAULT_TEXT_CONTENT, type ImageElement, type TextElement, type ZineElement } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { PAGE_H, PAGE_W, clampToPage } from '~/utils/zineLayout'

type KonvaEvent = {
  target: KonvaNode
  cancelBubble: boolean
}

type TextEditOptions = {
  selectAll?: boolean
}

type TextEditState = {
  id: string
  draft: string
  height: number
}

const {
  state,
  currentPageElements,
  selectElement,
  updateElement
} = useZineStore()

const containerRef = ref<HTMLElement | null>(null)
const stageRef = ref<{ getNode: () => KonvaStage } | null>(null)
const transformerRef = ref<{ getNode: () => KonvaTransformer } | null>(null)
const editingTextareaRef = ref<HTMLTextAreaElement | null>(null)
const size = reactive({ width: 0, height: 0 })
const loadedImages = shallowReactive(new Map<string, HTMLImageElement>())
const failedImages = shallowReactive(new Set<string>())
const editingText = ref<TextEditState | null>(null)

let resizeObserver: ResizeObserver | null = null

const selectedId = computed(() => state.value.selectedElementId)
const selectedElement = computed(() => selectedId.value ? state.value.elements[selectedId.value] ?? null : null)
const editingElement = computed(() => {
  const id = editingText.value?.id
  const element = id ? state.value.elements[id] ?? null : null

  return element?.type === 'text' ? element : null
})
const editingTextValue = computed(() => editingText.value?.draft ?? '')
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

const transformerConfig = computed(() => {
  const element = selectedElement.value
  const isText = element?.type === 'text'

  return {
    visible: !editingText.value,
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

const textEditorStyle = computed<CSSProperties>(() => {
  const element = editingElement.value
  const edit = editingText.value

  if (!element || !edit) return {}

  const stageContainer = stageRef.value?.getNode().container()
  const container = containerRef.value
  const scaleValue = scale.value
  let stageLeft = 0
  let stageTop = 0

  if (stageContainer && container) {
    const stageRect = stageContainer.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    stageLeft = stageRect.left - containerRect.left + container.scrollLeft
    stageTop = stageRect.top - containerRect.top + container.scrollTop
  }

  const fontSize = element.fontSize * scaleValue
  const lineHeight = element.fontSize * element.lineHeight * scaleValue
  const height = Math.max(lineHeight, edit.height * scaleValue)

  return {
    position: 'absolute',
    left: `${stageLeft + element.x * scaleValue}px`,
    top: `${stageTop + element.y * scaleValue}px`,
    width: `${Math.max(24, element.width * scaleValue)}px`,
    height: `${height}px`,
    minHeight: `${lineHeight}px`,
    color: element.fill,
    opacity: element.opacity,
    fontFamily: element.fontFamily,
    fontSize: `${fontSize}px`,
    fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: element.fontStyle === 'bold' ? '700' : '400',
    lineHeight: String(element.lineHeight),
    textAlign: element.align,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'top left'
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
    fill: failedImages.has(element.src) ? '#ffd3ca' : '#fff6c8',
    stroke: failedImages.has(element.src) ? '#f23d25' : '#070706',
    dash: [12, 8],
    draggable: !element.locked
  }
}

function textConfig(element: TextElement) {
  const isEditing = editingText.value?.id === element.id

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
    draggable: !element.locked && !isEditing
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

function handleTextEditRequest(element: TextElement, event: KonvaEvent) {
  event.cancelBubble = true
  void startTextEditing(element.id)
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

    if (editingText.value) {
      transformerNode.nodes([])
      transformerNode.getLayer()?.batchDraw()
      return
    }

    const selectedNode = selectedId.value ? stage.findOne(`#${selectedId.value}`) : null
    transformerNode.nodes(selectedNode ? [selectedNode] : [])
    transformerNode.getLayer()?.batchDraw()
  })
}

function syncTextEditorHeight() {
  const textarea = editingTextareaRef.value
  const edit = editingText.value
  const element = editingElement.value

  if (!textarea || !edit || !element) return

  textarea.style.height = 'auto'

  const scaleValue = scale.value
  const lineHeight = element.fontSize * element.lineHeight * scaleValue
  const minHeight = Math.max(lineHeight, element.height * scaleValue)
  const nextHeight = Math.max(minHeight, textarea.scrollHeight)

  edit.height = nextHeight / scaleValue
  textarea.style.height = `${nextHeight}px`
}

async function startTextEditing(id: string, options: TextEditOptions = {}) {
  const element = state.value.elements[id]

  if (element?.type !== 'text' || element.locked) return

  selectElement(id)
  editingText.value = {
    id,
    draft: element.text,
    height: element.height
  }
  updateTransformer()

  await nextTick()

  if (editingText.value?.id !== id) return

  const textarea = editingTextareaRef.value

  if (!textarea) return

  syncTextEditorHeight()
  textarea.focus()

  if (options.selectAll) {
    textarea.select()
    return
  }

  const cursorPosition = textarea.value.length
  textarea.setSelectionRange(cursorPosition, cursorPosition)
}

function commitTextEditing() {
  const edit = editingText.value
  const element = editingElement.value

  if (!edit) return

  if (!element) {
    editingText.value = null
    updateTransformer()
    return
  }

  const text = edit.draft.trim().length > 0 ? edit.draft : DEFAULT_TEXT_CONTENT

  updateElement(edit.id, {
    text,
    height: Math.max(element.height, edit.height)
  } as Partial<ZineElement>)
  editingText.value = null
  updateTransformer()
}

function cancelTextEditing() {
  if (!editingText.value) return

  editingText.value = null
  updateTransformer()
}

function handleTextEditorInput(event: Event) {
  const textarea = event.target as HTMLTextAreaElement

  if (!editingText.value) return

  editingText.value.draft = textarea.value
  syncTextEditorHeight()
}

function handleTextEditorKeydown(event: KeyboardEvent) {
  event.stopPropagation()

  if (event.key === 'Escape') {
    event.preventDefault()
    cancelTextEditing()
    return
  }

  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    commitTextEditing()
  }
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
  loadCanvasImages()
  updateTransformer()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => state.value.selectedPageId,
  () => {
    commitTextEditing()
  }
)

watch(
  editingElement,
  (element) => {
    if (!element && editingText.value) {
      editingText.value = null
      updateTransformer()
    }
  },
  { flush: 'post' }
)

watch(
  () => editingText.value?.id,
  () => updateTransformer(),
  { flush: 'post' }
)

watch(
  () => [
    state.value.selectedPageId,
    selectedId.value,
    currentPageElements.value.length,
    currentPageElements.value.map((element) => element.id).join(','),
    [...activeImageSources.value].join(',')
  ],
  () => {
    pruneCanvasImageMaps()
    loadCanvasImages()
    updateTransformer()
  },
  { flush: 'post' }
)

defineExpose({
  startTextEditing
})
</script>

<template>
  <div ref="containerRef" class="zine-canvas-wrap relative flex h-full min-h-[420px] items-center justify-center overflow-auto p-4 lg:p-8">
    <VStage
      ref="stageRef"
      :config="stageConfig"
      class="shadow-[var(--zine-shadow)]"
      @mousedown="handleStagePointer"
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
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
          <VRect
            v-else-if="element.type === 'image'"
            :config="imageFallbackConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
          <VText
            v-else
            :config="textConfig(element)"
            @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
            @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
            @dblclick="(event: KonvaEvent) => handleTextEditRequest(element, event)"
            @dbltap="(event: KonvaEvent) => handleTextEditRequest(element, event)"
            @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
            @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
          />
        </template>

        <VTransformer ref="transformerRef" :config="transformerConfig" />
      </VLayer>
    </VStage>

    <textarea
      v-if="editingElement"
      ref="editingTextareaRef"
      aria-label="Editar texto del fanzine"
      class="zine-inline-text-editor"
      :style="textEditorStyle"
      :value="editingTextValue"
      spellcheck="false"
      @input="handleTextEditorInput"
      @keydown="handleTextEditorKeydown"
      @blur="commitTextEditing"
      @click.stop
      @mousedown.stop
      @touchstart.stop
    />
  </div>
</template>

<style scoped>
.zine-inline-text-editor {
  box-sizing: border-box;
  z-index: 20;
  margin: 0;
  padding: 0;
  resize: none;
  overflow: hidden;
  appearance: none;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid #f23d25;
  border-radius: 2px;
  outline: 2px solid rgba(231, 255, 54, 0.84);
  box-shadow: 0 0 0 1px rgba(7, 7, 6, 0.22);
  letter-spacing: 0;
  caret-color: currentColor;
}

.zine-inline-text-editor::selection {
  background: rgba(242, 61, 37, 0.22);
}
</style>
