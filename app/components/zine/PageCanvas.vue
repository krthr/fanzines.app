<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, watch } from 'vue'
import type { CSSProperties } from 'vue'
import 'konva/lib/shapes/Image'
import 'konva/lib/shapes/Rect'
import 'konva/lib/shapes/Text'
import 'konva/lib/shapes/Transformer'
import {
  Group as VGroup,
  Image as VImage,
  Layer as VLayer,
  Rect as VRect,
  Stage as VStage,
  Text as VText,
  Transformer as VTransformer
} from 'vue-konva/core'
import type { Node as KonvaNode } from 'konva/lib/Node'
import type { Stage as KonvaStage } from 'konva/lib/Stage'
import type { Rect as KonvaRect } from 'konva/lib/shapes/Rect'
import type { Box, Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer'
import { PAGE_IDS, PAGE_LABELS, type ImageElement, type TextElement, type ZineElement } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZineImageImport, type ImageInputMethod } from '~/composables/useZineImageImport.client'
import { useZineDragState } from '~/composables/useZineDragState.client'
import { useZineEditorView } from '~/composables/useZineEditorView.client'
import { useZineElementActions } from '~/composables/useZineElementActions.client'
import { useTrackedZinePageSelection } from '~/composables/useTrackedZinePageSelection.client'
import {
  PAGE_H,
  PAGE_W,
  SAFE_MARGIN,
  clampToPage,
  formatMmSize,
  getPageSide
} from '~/utils/zineLayout'
import ZinePageRender from '~/components/zine/ZinePageRender.vue'

type KonvaEvent = {
  target: KonvaNode
  cancelBubble: boolean
}

type TextEditOptions = {
  selectAll?: boolean
}

type Box2d = {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

const props = defineProps<{
  // Show the facing page beside the active one ("Doble").
  spread?: boolean
  // Mobile: larger handles, and the context bar replaces the floating toolbar.
  compact?: boolean
}>()

const emit = defineEmits<{
  'request-upload': [inputMethod: ImageInputMethod]
  'add-text': []
}>()

const PAGE_RATIO = PAGE_H / PAGE_W
const MIN_PAGE_WIDTH = 180
const MAX_PAGE_WIDTH = 720
const SPREAD_GAP = 2
// The label row under a spread: 22px gap + one 16px line.
const SPREAD_LABELS_HEIGHT = 38
const TOOLBAR_HEIGHT = 40
// Leaves room for the rotation handle between the selection and the toolbar.
const TOOLBAR_GAP = 43
const TAG_GAP = 10
const TAG_HEIGHT = 22
const EDGE = 8

function cssToken(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const ORANGE = cssToken('--orange', '#d25a36')
const ORANGE_DEEP = cssToken('--orange-deep', '#8e3a22')
const INK = cssToken('--ink', '#ede7da')

const {
  state,
  currentPageElements,
  selectElement,
  updateElement
} = useZineStore()

const { processImageFiles } = useZineImageImport()
const { isDragActive, resetDrag } = useZineDragState()
const { isEditingText, facingPageId } = useZineEditorView()
const { coverPage, containPage, bringForward, sendBackward, removeSelected } = useZineElementActions()
const { selectTrackedPage } = useTrackedZinePageSelection()

const containerRef = ref<HTMLElement | null>(null)
const stageRef = ref<{ getNode: () => KonvaStage } | null>(null)
const transformerRef = ref<{ getNode: () => KonvaTransformer } | null>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const size = reactive({ width: 0, height: 0 })
const loadedImages = shallowReactive(new Map<string, HTMLImageElement>())
const failedImages = shallowReactive(new Set<string>())
const editingTextId = ref<string | null>(null)
const editingTextValue = ref('')
const textEditorRef = ref<HTMLTextAreaElement | null>(null)
const isDraggingElement = ref(false)
const isTransforming = ref(false)
// Where the selected node is while it is being dragged or transformed.
const liveBox = ref<Box2d | null>(null)
const toolbarWidth = ref(298)

let resizeObserver: ResizeObserver | null = null

const selectedId = computed(() => state.value.selectedElementId)
const selectedElement = computed(() => selectedId.value ? state.value.elements[selectedId.value] ?? null : null)
const editingTextElement = computed(() => {
  const element = editingTextId.value ? state.value.elements[editingTextId.value] ?? null : null
  return element?.type === 'text' ? element : null
})
const isEmptyPage = computed(() => currentPageElements.value.length === 0)
const activeImageSources = computed(() => new Set(Object.values(state.value.elements)
  .filter((element): element is ImageElement => element.type === 'image')
  .map((element) => element.src)))

const activePageId = computed(() => state.value.selectedPageId)
const activeSide = computed(() => getPageSide(activePageId.value))
const facingId = computed(() => props.spread ? facingPageId.value : null)

// ── Geometry ────────────────────────────────────────────────────────────────

// The stage is larger than the page so handles on the page edge stay reachable.
const stagePad = computed(() => props.compact ? 44 : 40)

const pageWidth = computed(() => {
  const { width, height } = size
  if (!width || !height) return props.compact ? 330 : facingId.value ? 372 : 440

  const fit = props.compact
    ? Math.min(width - 60, (height - 56) / PAGE_RATIO)
    : facingId.value
      ? Math.min((width - 102 - SPREAD_GAP) / 2, (height - SPREAD_LABELS_HEIGHT - 128) / PAGE_RATIO)
      : Math.min(width - 96, (height - 105) / PAGE_RATIO)

  return Math.round(Math.max(MIN_PAGE_WIDTH, Math.min(fit, MAX_PAGE_WIDTH)))
})

const pageHeight = computed(() => Math.round(pageWidth.value * PAGE_RATIO))
const scale = computed(() => pageWidth.value / PAGE_W)

// Top-left corner of the active page inside the stage area. The spread is centred.
const pageOrigin = computed(() => {
  const wrapWidth = facingId.value ? pageWidth.value * 2 + SPREAD_GAP : pageWidth.value
  const wrapHeight = pageHeight.value + (facingId.value ? SPREAD_LABELS_HEIGHT : 0)

  return {
    left: (size.width - wrapWidth) / 2 + (facingId.value && activeSide.value === 'right' ? pageWidth.value + SPREAD_GAP : 0),
    top: (size.height - wrapHeight) / 2
  }
})

const pageStyle = computed<CSSProperties>(() => ({
  width: `${pageWidth.value}px`,
  height: `${pageHeight.value}px`
}))

const stageStyle = computed<CSSProperties>(() => ({
  left: `${-stagePad.value}px`,
  top: `${-stagePad.value}px`
}))

const stageConfig = computed(() => ({
  width: pageWidth.value + stagePad.value * 2,
  height: pageHeight.value + stagePad.value * 2
}))

const layerConfig = computed(() => ({
  x: stagePad.value,
  y: stagePad.value,
  scaleX: scale.value,
  scaleY: scale.value
}))

const backgroundConfig = {
  x: 0,
  y: 0,
  width: PAGE_W,
  height: PAGE_H,
  fill: '#ffffff',
  name: 'page-background',
  listening: true
}

const contentConfig = {
  clipX: 0,
  clipY: 0,
  clipWidth: PAGE_W,
  clipHeight: PAGE_H
}

// "Guías": the 5 mm safe margin.
const safeMarginConfig = {
  x: SAFE_MARGIN,
  y: SAFE_MARGIN,
  width: PAGE_W - SAFE_MARGIN * 2,
  height: PAGE_H - SAFE_MARGIN * 2,
  stroke: 'rgba(0, 163, 255, 0.4)',
  strokeWidth: 1,
  strokeScaleEnabled: false,
  listening: false
}

// ── Selection chrome: toolbar above, size tag below ─────────────────────────

const selectionBox = computed(() => {
  const element = selectedElement.value
  if (!element || element.pageId !== activePageId.value) return null

  const box = liveBox.value ?? element
  const radians = box.rotation * Math.PI / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const corners = [[0, 0], [box.width, 0], [box.width, box.height], [0, box.height]]
    .map(([px, py]) => [box.x + px! * cos - py! * sin, box.y + px! * sin + py! * cos])
  const xs = corners.map((corner) => corner[0]!)
  const ys = corners.map((corner) => corner[1]!)

  return {
    left: Math.min(...xs) * scale.value,
    right: Math.max(...xs) * scale.value,
    top: Math.min(...ys) * scale.value,
    bottom: Math.max(...ys) * scale.value,
    label: formatMmSize(box.width, box.height)
  }
})

const showToolbar = computed(() => Boolean(
  !props.compact
  && selectionBox.value
  && !isDraggingElement.value
  && !isTransforming.value
  && !editingTextId.value
  && !isDragActive.value
))

const showSizeTag = computed(() => Boolean(!props.compact && selectionBox.value && !editingTextId.value))

const toolbarStyle = computed<CSSProperties>(() => {
  const box = selectionBox.value
  if (!box) return {}

  const origin = pageOrigin.value
  const maxLeft = size.width - EDGE - origin.left - toolbarWidth.value
  const left = Math.max(EDGE - origin.left, Math.min(box.left + 10, maxLeft))
  const top = Math.max(EDGE - origin.top, box.top - TOOLBAR_GAP - TOOLBAR_HEIGHT)

  return {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`
  }
})

const sizeTagStyle = computed<CSSProperties>(() => {
  const box = selectionBox.value
  if (!box) return {}

  const maxTop = size.height - EDGE - pageOrigin.value.top - TAG_HEIGHT

  return {
    left: `${Math.round((box.left + box.right) / 2)}px`,
    top: `${Math.round(Math.min(box.bottom + TAG_GAP, maxTop))}px`
  }
})

// ── Empty page ──────────────────────────────────────────────────────────────

const emptySub = computed(() => {
  const remaining = PAGE_IDS.length - PAGE_IDS.indexOf(activePageId.value)
  return remaining > 1
    ? `Hasta ${remaining} a la vez: va una en cada página`
    : 'Aquí va una: es la última página'
})

// ── Inline text editor ──────────────────────────────────────────────────────

const textEditorStyle = computed<CSSProperties>(() => {
  const element = editingTextElement.value
  if (!element) return {}

  const canvasScale = scale.value

  return {
    left: `${element.x * canvasScale}px`,
    top: `${element.y * canvasScale}px`,
    width: `${Math.max(80, element.width * canvasScale)}px`,
    minHeight: `${Math.max(40, element.height * canvasScale)}px`,
    opacity: element.opacity,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'top left'
  }
})

const textEditorFontStyle = computed<CSSProperties>(() => {
  const element = editingTextElement.value
  if (!element) return {}

  return {
    color: element.fill,
    fontFamily: element.fontFamily,
    fontSize: `${element.fontSize * scale.value}px`,
    fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: element.fontStyle === 'bold' ? 700 : 400,
    lineHeight: String(element.lineHeight),
    textAlign: element.align
  }
})

// ── Konva node configs ──────────────────────────────────────────────────────

const transformerConfig = computed(() => {
  const element = selectedElement.value
  const isText = element?.type === 'text'
  const anchorSize = props.compact ? 18 : 12

  return {
    rotateEnabled: true,
    rotateAnchorOffset: props.compact ? 30 : 24,
    keepRatio: !isText,
    enabledAnchors: isText
      ? ['middle-left', 'middle-right']
      : ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    anchorSize,
    anchorCornerRadius: 0,
    borderStroke: ORANGE,
    borderStrokeWidth: 2,
    anchorStroke: ORANGE,
    anchorStrokeWidth: 2,
    anchorFill: '#ffffff',
    // The rotation handle is round, so it does not read as a resize handle.
    anchorStyleFunc: (anchor: KonvaRect) => {
      if (anchor.hasName('rotater')) anchor.cornerRadius(anchorSize / 2)
    },
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
    draggable: editingTextId.value !== element.id
  }
}

function imageFallbackConfig(element: ImageElement) {
  const failed = failedImages.has(element.src)

  return {
    id: element.id,
    name: 'zine-element',
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    fill: failed ? '#f3d9cf' : INK,
    stroke: failed ? ORANGE_DEEP : '#3a3631',
    dash: [12, 8],
    draggable: editingTextId.value !== element.id
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
    draggable: !isEditing
  }
}

// ── Pointer handling ────────────────────────────────────────────────────────

function setStageCursor(cursor: string, event?: KonvaEvent) {
  const stage = event?.target.getStage() ?? stageRef.value?.getNode()
  if (!stage) return
  stage.container().style.cursor = cursor
}

function resetStageCursor(event?: KonvaEvent) {
  setStageCursor('', event)
}

function handleCanvasMouseLeave() {
  if (!isDraggingElement.value) {
    resetStageCursor()
  }
}

// A pointer cursor where a press does something other than deselect: the band
// over the facing page, and an empty page (which opens the file picker).
let showsHintCursor = false

function handleStageMouseMove(event: KonvaEvent) {
  const stage = event.target.getStage()
  if (!stage || isDraggingElement.value || isTransforming.value) return

  const hint = event.target === stage
    ? isOverFacingPage(stage)
    : isEmptyPage.value && event.target.name() === 'page-background'

  if (hint) {
    showsHintCursor = true
    setStageCursor('pointer', event)
  } else if (showsHintCursor) {
    showsHintCursor = false
    resetStageCursor(event)
  }
}

// The stage overhangs the facing page by its padding; a press there is meant
// for the facing page.
function isOverFacingPage(stage: KonvaStage) {
  const pointer = stage.getPointerPosition()
  if (!pointer || !facingId.value) return false

  const x = pointer.x - stagePad.value
  const y = pointer.y - stagePad.value
  if (y < 0 || y > pageHeight.value) return false

  return activeSide.value === 'left' ? x > pageWidth.value : x < 0
}

function handleStagePointer(event: KonvaEvent) {
  const stage = event.target.getStage()
  const clickedTransformer = event.target.getParent()?.className === 'Transformer'

  if (clickedTransformer || !stage) return

  if (event.target === stage) {
    resetStageCursor(event)
    if (isOverFacingPage(stage)) {
      selectFacingPage()
      return
    }
    selectElement(null)
    return
  }

  if (event.target.name() === 'page-background') {
    resetStageCursor(event)
    if (isEmptyPage.value) {
      emit('request-upload', 'file_picker')
      return
    }
    selectElement(null)
  }
}

function selectFacingPage() {
  if (!facingId.value) return
  selectTrackedPage(facingId.value, { input_method: 'facing_page' })
}

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes('Files'))
}

function handleCanvasDragOver(event: DragEvent) {
  if (!isFileDrag(event)) return
  event.preventDefault()
}

function handleCanvasDrop(event: DragEvent) {
  if (!isFileDrag(event)) return
  event.preventDefault()
  event.stopPropagation()
  resetDrag()
  const files = Array.from(event.dataTransfer?.files ?? [])
  void processImageFiles(files, { inputMethod: 'drag_drop', dropTarget: 'canvas' })
}

function handleElementPointer(element: ZineElement, event: KonvaEvent) {
  event.cancelBubble = true
  if (editingTextId.value !== element.id) {
    setStageCursor('grab', event)
  }
  selectElement(element.id)
}

function handleElementPointerEnter(element: ZineElement, event: KonvaEvent) {
  if (editingTextId.value !== element.id) {
    setStageCursor('grab', event)
  }
}

function handleElementPointerLeave(event: KonvaEvent) {
  if (!isDraggingElement.value) {
    resetStageCursor(event)
  }
}

function readLiveBox(node: KonvaNode): Box2d {
  return {
    x: node.x(),
    y: node.y(),
    width: node.width() * node.scaleX(),
    height: node.height() * node.scaleY(),
    rotation: node.rotation()
  }
}

function handleDragStart(event: KonvaEvent) {
  isDraggingElement.value = true
  setStageCursor('grabbing', event)
}

function handleDragMove(event: KonvaEvent) {
  liveBox.value = readLiveBox(event.target)
}

function handleDragEnd(element: ZineElement, event: KonvaEvent) {
  const node = event.target
  updateElement(element.id, {
    x: clampToPage(node.x(), PAGE_W),
    y: clampToPage(node.y(), PAGE_H)
  })
  isDraggingElement.value = false
  liveBox.value = null
  setStageCursor('grab', event)
}

function handleTransformStart() {
  isTransforming.value = true
}

function handleTransform(event: KonvaEvent) {
  liveBox.value = readLiveBox(event.target)
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
  isTransforming.value = false
  liveBox.value = null
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
    } else if (selectedElement.value) {
      setStageCursor('grab')
    } else {
      resetStageCursor()
    }
  })
}

// ── Text editing ────────────────────────────────────────────────────────────

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
  selectElement(element.id)
  editingTextId.value = element.id
  editingTextValue.value = element.text
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

async function startTextEditing(id: string, options: TextEditOptions = {}) {
  const element = state.value.elements[id]

  if (element?.type !== 'text') return

  startEditingText(element)
  await nextTick()

  if (options.selectAll && editingTextId.value === id) {
    textEditorRef.value?.select()
  }
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
  updateTransformer()
}

function cancelTextEdit() {
  editingTextId.value = null
  editingTextValue.value = ''
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

function isInteractiveTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  if (!element) return false

  return Boolean(element.closest([
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[role="button"]',
    '[role="checkbox"]',
    '[role="combobox"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="radio"]',
    '[role="slider"]',
    '[role="switch"]',
    '[role="tab"]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')))
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || isInteractiveTarget(event.target)) return

  const element = selectedElement.value
  if (element?.type !== 'text') return

  event.preventDefault()
  startEditingText(element)
}

// ── Images ──────────────────────────────────────────────────────────────────

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
    if (!entry) return
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
  isEditingText.value = false
})

watch(editingTextId, (id) => {
  isEditingText.value = id !== null
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

// The toolbar is clamped to the stage area, which needs its real width.
watch(
  () => [showToolbar.value, selectedElement.value?.type],
  () => {
    if (toolbarRef.value) toolbarWidth.value = toolbarRef.value.offsetWidth
  },
  { flush: 'post' }
)

defineExpose({
  startTextEditing
})
</script>

<template>
  <div
    ref="containerRef"
    class="canvas"
    :class="{ 'is-compact': compact }"
    @dragover="handleCanvasDragOver"
    @drop="handleCanvasDrop"
    @mouseleave="handleCanvasMouseLeave"
  >
    <div class="wrap">
      <div class="spread">
        <button
          v-if="facingId && activeSide === 'right'"
          type="button"
          class="page page-facing"
          :style="pageStyle"
          :aria-label="`Editar ${PAGE_LABELS[facingId].toLowerCase()}`"
          @click="selectFacingPage"
        >
          <ZinePageRender :page-id="facingId" :width="pageWidth" />
        </button>

        <div class="page page-active" :style="pageStyle">
          <VStage
            ref="stageRef"
            :config="stageConfig"
            class="stage"
            :style="stageStyle"
            @mousedown="handleStagePointer"
            @touchstart="handleStagePointer"
            @mousemove="handleStageMouseMove"
          >
            <VLayer :config="layerConfig">
              <VRect :config="backgroundConfig" />

              <VGroup :config="contentConfig">
                <template v-for="element in currentPageElements" :key="element.id">
                  <VImage
                    v-if="element.type === 'image' && loadedImages.has(element.src)"
                    :config="imageConfig(element)"
                    @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
                    @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
                    @mouseenter="(event: KonvaEvent) => handleElementPointerEnter(element, event)"
                    @mouseleave="(event: KonvaEvent) => handleElementPointerLeave(event)"
                    @dragstart="handleDragStart"
                    @dragmove="handleDragMove"
                    @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
                    @transformstart="handleTransformStart"
                    @transform="handleTransform"
                    @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
                  />
                  <VRect
                    v-else-if="element.type === 'image'"
                    :config="imageFallbackConfig(element)"
                    @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
                    @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
                    @mouseenter="(event: KonvaEvent) => handleElementPointerEnter(element, event)"
                    @mouseleave="(event: KonvaEvent) => handleElementPointerLeave(event)"
                    @dragstart="handleDragStart"
                    @dragmove="handleDragMove"
                    @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
                    @transformstart="handleTransformStart"
                    @transform="handleTransform"
                    @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
                  />
                  <VText
                    v-else
                    :config="textConfig(element)"
                    @mousedown="(event: KonvaEvent) => handleElementPointer(element, event)"
                    @touchstart="(event: KonvaEvent) => handleElementPointer(element, event)"
                    @mouseenter="(event: KonvaEvent) => handleElementPointerEnter(element, event)"
                    @mouseleave="(event: KonvaEvent) => handleElementPointerLeave(event)"
                    @dragstart="handleDragStart"
                    @dragmove="handleDragMove"
                    @dragend="(event: KonvaEvent) => handleDragEnd(element, event)"
                    @transformstart="handleTransformStart"
                    @transform="handleTransform"
                    @transformend="(event: KonvaEvent) => handleTransformEnd(element, event)"
                    @dblclick="(event: KonvaEvent) => handleTextEditRequest(element, event)"
                    @dbltap="(event: KonvaEvent) => handleTextEditRequest(element, event)"
                  />
                </template>
              </VGroup>

              <VRect v-if="state.previewGuides" :config="safeMarginConfig" />
              <VTransformer ref="transformerRef" :config="transformerConfig" />
            </VLayer>
          </VStage>

          <div v-if="isEmptyPage" class="empty">
            <span class="empty-icon">
              <UIcon name="i-lucide-image-plus" aria-hidden="true" />
            </span>
            <p class="empty-title">
              Suelta tus fotos
            </p>
            <p class="empty-sub">
              {{ emptySub }}
            </p>
            <div class="empty-actions">
              <button type="button" class="empty-pick" @click="emit('request-upload', 'empty_state_button')">
                <UIcon name="i-lucide-upload" aria-hidden="true" />
                Elegir fotos
              </button>
              <button type="button" class="empty-link" @click="emit('add-text')">
                o empieza escribiendo el título
              </button>
            </div>
          </div>

          <div v-if="editingTextElement" class="text-edit" :style="textEditorStyle">
            <textarea
              ref="textEditorRef"
              aria-label="Editar texto del fanzine"
              class="text-edit-input"
              :style="textEditorFontStyle"
              :value="editingTextValue"
              @blur="commitTextEdit"
              @input="handleTextEditorInput"
              @keydown="handleTextEditorKeydown"
            />
            <i class="text-edit-handle is-tl" /><i class="text-edit-handle is-tr" />
            <i class="text-edit-handle is-bl" /><i class="text-edit-handle is-br" />
          </div>

          <div
            v-if="showToolbar && selectedElement"
            ref="toolbarRef"
            class="toolbar ed-light"
            role="toolbar"
            aria-label="Acciones de la selección"
            :style="toolbarStyle"
          >
            <template v-if="selectedElement.type === 'image'">
              <button type="button" class="tool has-label" @click="coverPage">
                <UIcon name="i-lucide-expand" aria-hidden="true" />
                Rellenar
              </button>
              <button type="button" class="tool has-label" @click="containPage">
                <UIcon name="i-lucide-scan" aria-hidden="true" />
                Encajar
              </button>
              <span class="tool-sep" aria-hidden="true" />
            </template>
            <button type="button" class="tool" aria-label="Al frente" title="Al frente" @click="bringForward">
              <UIcon name="i-lucide-bring-to-front" aria-hidden="true" />
            </button>
            <button type="button" class="tool" aria-label="Atrás" title="Atrás" @click="sendBackward">
              <UIcon name="i-lucide-send-to-back" aria-hidden="true" />
            </button>
            <span class="tool-sep" aria-hidden="true" />
            <button
              type="button"
              class="tool is-danger"
              aria-label="Eliminar"
              title="Eliminar"
              @click="removeSelected('toolbar')"
            >
              <UIcon name="i-lucide-trash-2" aria-hidden="true" />
            </button>
          </div>

          <span v-if="showSizeTag && selectionBox" class="size-tag" :style="sizeTagStyle">
            {{ selectionBox.label }}
          </span>
        </div>

        <button
          v-if="facingId && activeSide === 'left'"
          type="button"
          class="page page-facing"
          :style="pageStyle"
          :aria-label="`Editar ${PAGE_LABELS[facingId].toLowerCase()}`"
          @click="selectFacingPage"
        >
          <ZinePageRender :page-id="facingId" :width="pageWidth" />
        </button>
      </div>

      <div v-if="facingId" class="labels" :class="{ 'is-reversed': activeSide === 'right' }">
        <p class="label" :style="{ width: `${pageWidth}px` }">
          <strong>{{ PAGE_LABELS[activePageId] }}</strong>
          <span class="label-state">editando</span>
        </p>
        <p class="label is-facing" :style="{ width: `${pageWidth}px` }">
          <strong>{{ PAGE_LABELS[facingId] }}</strong>
          <span>clic para editarla</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.wrap {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 22px;
}

.spread {
  display: flex;
  gap: 2px;
  background: var(--ed-canvas);
  box-shadow: 10px 10px 0 var(--orange-deep);
}

.canvas.is-compact .spread {
  box-shadow: 8px 8px 0 var(--orange-deep);
}

.page {
  position: relative;
  flex: none;
  background: #fff;
}

.page-active {
  z-index: 1;
}

.page-facing {
  display: block;
  padding: 0;
  border: 0;
  opacity: 0.68;
  transition: opacity 180ms ease;
}

.page-facing:hover,
.page-facing:focus-visible {
  opacity: 0.85;
}

.stage {
  position: absolute;
  touch-action: none;
}

/* Labels under the spread */

.labels {
  display: flex;
  gap: 2px;
}

.labels.is-reversed {
  flex-direction: row-reverse;
}

.label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--ink);
  font-size: 13px;
  line-height: 16px;
}

.label strong {
  font-weight: 700;
}

.label.is-facing {
  color: var(--muted);
}

.label-state {
  color: var(--acid);
  font-family: var(--font-type);
  line-height: 13px;
}

/* Empty page */

.empty {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: flex;
  width: min(320px, 100% - 40px);
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 22px 16px;
  border: 2px solid #c9c2b5;
  background: #faf8f3;
  color: var(--ink-dark);
  pointer-events: none;
  text-align: center;
  transform: translate(-50%, -50%);
}

.empty-icon {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 50%;
  background: var(--acid);
}

.empty-icon .iconify {
  width: 24px;
  height: 24px;
}

.empty-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 26px;
  letter-spacing: 0.5px;
  line-height: 39px;
  text-transform: uppercase;
}

.empty-sub {
  margin: 0;
  color: var(--ed-faint);
  font-size: 14px;
  line-height: 18px;
}

.empty-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.empty-pick,
.empty-link {
  pointer-events: auto;
}

.empty-pick {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 0;
  background: var(--ink-dark);
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  transition: background 180ms ease;
}

.empty-pick:hover {
  background: var(--text-dark);
}

.empty-pick .iconify {
  width: 16px;
  height: 16px;
}

.empty-pick:focus-visible,
.empty-link:focus-visible {
  outline-color: var(--ink-dark);
}

.empty-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink-dark);
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-underline-offset: 4px;
}

.empty-link:hover {
  text-decoration: underline;
}

/* Inline text editor: the frame and its four corner marks stand in for the transformer. */

.text-edit {
  position: absolute;
  z-index: 3;
  outline: 2px solid var(--orange);
  outline-offset: 4px;
}

.text-edit-input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: inherit;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  outline: 0;
  background: transparent;
  caret-color: var(--orange);
  cursor: text;
  overflow-wrap: break-word;
  resize: none;
  white-space: pre-wrap;
}

.text-edit-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid var(--orange);
  background: #fff;
  pointer-events: none;
}

.text-edit-handle.is-tl { top: -12px; left: -12px; }
.text-edit-handle.is-tr { top: -12px; right: -12px; }
.text-edit-handle.is-bl { bottom: -12px; left: -12px; }
.text-edit-handle.is-br { right: -12px; bottom: -12px; }

/* Floating toolbar */

.toolbar {
  position: absolute;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--paper);
  box-shadow: inset 0 0 0 1.5px var(--ink-dark), 4px 4px 0 var(--orange-deep);
  white-space: nowrap;
}

.tool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  color: var(--ink-dark);
  font-size: 13px;
  font-weight: 600;
  line-height: 16px;
  transition: background 180ms ease;
}

.tool.has-label {
  padding: 0 10px;
}

.tool:hover {
  background: rgb(11 10 9 / 10%);
}

.tool .iconify {
  width: 16px;
  height: 16px;
}

.tool.is-danger {
  color: var(--orange-deep);
}

.tool-sep {
  width: 1px;
  height: 20px;
  background: var(--ed-hairline);
}

/* Size tag */

.size-tag {
  position: absolute;
  z-index: 4;
  padding: 3px 8px;
  background: var(--orange);
  color: var(--ink-dark);
  font-size: 13px;
  font-weight: 600;
  line-height: 16px;
  pointer-events: none;
  transform: translateX(-50%);
  white-space: nowrap;
}
</style>
