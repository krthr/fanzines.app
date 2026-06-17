import { computed, watch } from 'vue'
import {
  DEFAULT_TEXT_CONTENT,
  FONT_OPTIONS,
  PAGE_IDS,
  type ImageBatchInsertResult,
  type ImageBatchSkippedFile,
  type ImageElement,
  type ImageInsertResult,
  type PageId,
  type TextElement,
  type ZineElement,
  type ZineState
} from '~/types/zine'
import { clearCachedHtmlImages, forgetCachedHtmlImage, pruneCachedHtmlImages } from '~/utils/zineImageCache'
import { PAGE_H, PAGE_W } from '~/utils/zineLayout'

const MAX_WARN_SIZE = 8 * 1024 * 1024
const MAX_IMAGE_LONG_EDGE = 2400

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `zine-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createInitialPageElementIds(): Record<PageId, string[]> {
  return PAGE_IDS.reduce((acc, pageId) => {
    acc[pageId] = []
    return acc
  }, {} as Record<PageId, string[]>)
}

function createInitialZineState(): ZineState {
  return {
    selectedPageId: 'front-cover',
    selectedElementId: null,
    elements: {},
    pageElementIds: createInitialPageElementIds(),
    previewGuides: true,
    exportGuides: true,
    exportSafeMargins: true
  }
}

function revokeIfObjectUrl(element?: ZineElement) {
  if (import.meta.client && element?.type === 'image' && element.src.startsWith('blob:')) {
    URL.revokeObjectURL(element.src)
  }
}

function loadImageFromObjectUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
    image.src = src
  })
}

function createCanvasBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('No se pudo optimizar la imagen.'))
      }
    }, mimeType, quality)
  })
}

async function createDownsampledImageUrl(image: HTMLImageElement, file: File) {
  const longEdge = Math.max(image.naturalWidth, image.naturalHeight)
  if (longEdge <= MAX_IMAGE_LONG_EDGE) return null

  const scale = MAX_IMAGE_LONG_EDGE / longEdge
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) return null

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await createCanvasBlob(canvas, mimeType, mimeType === 'image/jpeg' ? 0.9 : undefined)

  return URL.createObjectURL(blob)
}

async function prepareImageFile(file: File) {
  const originalSrc = URL.createObjectURL(file)

  try {
    const originalImage = await loadImageFromObjectUrl(originalSrc)
    const downsampledSrc = await createDownsampledImageUrl(originalImage, file)

    if (!downsampledSrc) {
      return {
        src: originalSrc,
        image: originalImage
      }
    }

    URL.revokeObjectURL(originalSrc)

    try {
      return {
        src: downsampledSrc,
        image: await loadImageFromObjectUrl(downsampledSrc)
      }
    } catch {
      URL.revokeObjectURL(downsampledSrc)
      throw new Error('No se pudo cargar la imagen optimizada.')
    }
  } catch (error) {
    URL.revokeObjectURL(originalSrc)
    throw error
  }
}

function getImageWarning(file: File) {
  return file.size > MAX_WARN_SIZE
    ? 'La imagen es grande; si notas lentitud, conviene usar una versión reducida.'
    : undefined
}

function createSkippedFile(file: File, reason: ImageBatchSkippedFile['reason'], message: string): ImageBatchSkippedFile {
  return {
    fileName: file.name || 'Archivo sin nombre',
    reason,
    message
  }
}

function activeImageSources(state: ZineState) {
  return new Set(Object.values(state.elements)
    .filter((element): element is ImageElement => element.type === 'image')
    .map((element) => element.src))
}

function isEmptyTextElement(element: ZineElement | undefined): element is TextElement {
  return element?.type === 'text' && element.text.trim().length === 0
}

export function useZineStore() {
  const state = useState<ZineState>('mini-zine-a4-state', createInitialZineState)
  const cachePruneWatchRegistered = useState('mini-zine-a4-cache-prune-watch-registered', () => false)

  if (import.meta.client && !cachePruneWatchRegistered.value) {
    cachePruneWatchRegistered.value = true
    watch(state, (value) => {
      pruneCachedHtmlImages(activeImageSources(value))
    }, { deep: true, flush: 'post' })
  }

  const selectedElement = computed(() => {
    const id = state.value.selectedElementId
    return id ? state.value.elements[id] ?? null : null
  })

  const currentPageElements = computed(() => {
    const ids = state.value.pageElementIds[state.value.selectedPageId] ?? []
    return ids.map((id) => state.value.elements[id]).filter(Boolean)
  })

  const elementCount = computed(() => Object.keys(state.value.elements).length)

  function deleteSelectedEmptyTextElement() {
    const selectedId = state.value.selectedElementId
    const element = selectedId ? state.value.elements[selectedId] : undefined

    if (selectedId && isEmptyTextElement(element)) {
      deleteElement(selectedId)
    }
  }

  function selectPage(pageId: PageId) {
    deleteSelectedEmptyTextElement()
    state.value.selectedPageId = pageId
    state.value.selectedElementId = null
  }

  function selectElement(id: string | null) {
    if (id !== state.value.selectedElementId) {
      deleteSelectedEmptyTextElement()
    }

    state.value.selectedElementId = id
  }

  function insertElement(element: ZineElement) {
    deleteSelectedEmptyTextElement()
    state.value.elements[element.id] = element
    state.value.pageElementIds[element.pageId].push(element.id)
    state.value.selectedElementId = element.id
  }

  async function addImageElement(file: File, pageId: PageId = state.value.selectedPageId): Promise<ImageInsertResult> {
    if (!import.meta.client) {
      return { ok: false, error: 'La carga de imágenes solo está disponible en el navegador.' }
    }

    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'El archivo seleccionado no parece ser una imagen compatible.' }
    }

    try {
      const { src, image } = await prepareImageFile(file)
      const margin = PAGE_W * 0.1
      const maxW = PAGE_W - margin * 2
      const maxH = PAGE_H - margin * 2
      const scale = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight, 1)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale

      const element: ImageElement = {
        id: createId(),
        type: 'image',
        pageId,
        src,
        fileName: file.name,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        x: (PAGE_W - width) / 2,
        y: (PAGE_H - height) / 2,
        width,
        height,
        rotation: 0,
        opacity: 1
      }

      insertElement(element)

      return {
        ok: true,
        warning: getImageWarning(file)
      }
    } catch {
      return { ok: false, error: 'No se pudo cargar la imagen seleccionada.' }
    }
  }

  async function addImageElements(files: File[], startPageId?: PageId): Promise<ImageBatchInsertResult> {
    const result: ImageBatchInsertResult = {
      importedCount: 0,
      skippedFiles: [],
      errors: [],
      warnings: [],
      largeFileCount: 0,
      overflowCount: 0
    }

    const effectiveStartPageId = startPageId && PAGE_IDS.includes(startPageId) ? startPageId : state.value.selectedPageId
    const startIndex = PAGE_IDS.indexOf(effectiveStartPageId)
    const targetPageIds = PAGE_IDS.slice(Math.max(startIndex, 0))
    let targetPageIndex = 0
    let lastInsertedPageId: PageId | null = null

    for (const file of files) {
      const pageId = targetPageIds[targetPageIndex]

      if (!pageId) {
        result.overflowCount += 1
        result.skippedFiles.push(createSkippedFile(
          file,
          'no-page',
          'No quedan páginas disponibles para esta imagen.'
        ))
        continue
      }

      const insertResult = await addImageElement(file, pageId)

      if (!insertResult.ok) {
        const reason: ImageBatchSkippedFile['reason'] = !import.meta.client
          ? 'browser-only'
          : file.type.startsWith('image/')
            ? 'load-error'
            : 'not-image'

        result.skippedFiles.push(createSkippedFile(
          file,
          reason,
          insertResult.error ?? 'No se pudo cargar este archivo.'
        ))
        result.errors.push(insertResult.error ?? 'No se pudo cargar un archivo.')
        continue
      }

      result.importedCount += 1
      targetPageIndex += 1
      lastInsertedPageId = pageId

      if (insertResult.warning) {
        result.largeFileCount += 1
        result.warnings.push(insertResult.warning)
      }
    }

    if (result.overflowCount > 0) {
      result.warnings.push('Algunas imágenes se omitieron porque no quedaban páginas disponibles.')
    }

    if (lastInsertedPageId) {
      state.value.selectedPageId = lastInsertedPageId
    }

    return result
  }

  function addTextElement() {
    const element: TextElement = {
      id: createId(),
      type: 'text',
      pageId: state.value.selectedPageId,
      text: DEFAULT_TEXT_CONTENT,
      x: PAGE_W * 0.15,
      y: PAGE_H * 0.16,
      width: PAGE_W * 0.7,
      height: 180,
      rotation: 0,
      opacity: 1,
      fontFamily: FONT_OPTIONS[0],
      fontSize: 64,
      fontStyle: 'normal',
      fill: '#1d1c18',
      align: 'left',
      lineHeight: 1.2
    }

    insertElement(element)
    return element.id
  }

  function updateElement(id: string, patch: Partial<ZineElement>) {
    const current = state.value.elements[id]
    if (!current) return

    state.value.elements[id] = {
      ...current,
      ...patch
    } as ZineElement
  }

  function deleteElement(id: string) {
    const current = state.value.elements[id]
    if (!current) return

    if (current.type === 'image') {
      forgetCachedHtmlImage(current.src)
    }
    revokeIfObjectUrl(current)
    delete state.value.elements[id]
    state.value.pageElementIds[current.pageId] = state.value.pageElementIds[current.pageId].filter((item) => item !== id)

    if (state.value.selectedElementId === id) {
      state.value.selectedElementId = null
    }
  }

  function moveElementForward(id: string) {
    const element = state.value.elements[id]
    if (!element) return

    const ids = state.value.pageElementIds[element.pageId]
    const index = ids.indexOf(id)
    if (index === -1 || index === ids.length - 1) return

    ids.splice(index, 1)
    ids.splice(index + 1, 0, id)
  }

  function moveElementBackward(id: string) {
    const element = state.value.elements[id]
    if (!element) return

    const ids = state.value.pageElementIds[element.pageId]
    const index = ids.indexOf(id)
    if (index <= 0) return

    ids.splice(index, 1)
    ids.splice(index - 1, 0, id)
  }

  function resetZine() {
    Object.values(state.value.elements).forEach(revokeIfObjectUrl)
    clearCachedHtmlImages()
    state.value = createInitialZineState()
  }

  return {
    state,
    selectedElement,
    currentPageElements,
    elementCount,
    selectPage,
    selectElement,
    addImageElement,
    addImageElements,
    addTextElement,
    updateElement,
    deleteElement,
    moveElementForward,
    moveElementBackward,
    resetZine
  }
}
