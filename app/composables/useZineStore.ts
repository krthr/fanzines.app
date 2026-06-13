import { computed } from 'vue'
import {
  FONT_OPTIONS,
  PAGE_IDS,
  type ImageElement,
  type ImageInsertResult,
  type PageId,
  type TextElement,
  type ZineElement,
  type ZineState
} from '~/types/zine'
import { PAGE_H, PAGE_W } from '~/utils/zineLayout'

const MAX_WARN_SIZE = 8 * 1024 * 1024

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
    exportGuides: true
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

export function useZineStore() {
  const state = useState<ZineState>('mini-zine-a4-state', createInitialZineState)

  const selectedElement = computed(() => {
    const id = state.value.selectedElementId
    return id ? state.value.elements[id] ?? null : null
  })

  const currentPageElements = computed(() => {
    const ids = state.value.pageElementIds[state.value.selectedPageId] ?? []
    return ids.map((id) => state.value.elements[id]).filter(Boolean)
  })

  const elementCount = computed(() => Object.keys(state.value.elements).length)

  function selectPage(pageId: PageId) {
    state.value.selectedPageId = pageId
    state.value.selectedElementId = null
  }

  function selectElement(id: string | null) {
    state.value.selectedElementId = id
  }

  function insertElement(element: ZineElement) {
    state.value.elements[element.id] = element
    state.value.pageElementIds[element.pageId].push(element.id)
    state.value.selectedElementId = element.id
  }

  async function addImageElement(file: File): Promise<ImageInsertResult> {
    if (!import.meta.client) {
      return { ok: false, error: 'La carga de imágenes solo está disponible en el navegador.' }
    }

    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'El archivo seleccionado no parece ser una imagen compatible.' }
    }

    const src = URL.createObjectURL(file)

    try {
      const image = await loadImageFromObjectUrl(src)
      const margin = PAGE_W * 0.1
      const maxW = PAGE_W - margin * 2
      const maxH = PAGE_H - margin * 2
      const scale = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight, 1)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale

      const element: ImageElement = {
        id: createId(),
        type: 'image',
        pageId: state.value.selectedPageId,
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
        warning: file.size > MAX_WARN_SIZE
          ? 'La imagen es grande; si notas lentitud, conviene usar una versión reducida.'
          : undefined
      }
    } catch {
      URL.revokeObjectURL(src)
      return { ok: false, error: 'No se pudo cargar la imagen seleccionada.' }
    }
  }

  function addTextElement() {
    const element: TextElement = {
      id: createId(),
      type: 'text',
      pageId: state.value.selectedPageId,
      text: 'Texto',
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
    addTextElement,
    updateElement,
    deleteElement,
    moveElementForward,
    moveElementBackward,
    resetZine
  }
}
