import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { PAGE_IDS, type PageId, type ZineElement } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { renderPageCanvas } from '~/utils/renderPage.client'

// PROTOTYPE: shared live texture cache for the 3D fanzine variants.
// Renders each dirty page via the real `renderPageCanvas` helper so edits in the
// editor immediately appear on the 3D leaves.
const RENDER_WIDTH = 420
const MAX_PIXEL_RATIO = 2
const DEBOUNCE_MS = 120

export function useZine3DTextures() {
  const { state } = useZineStore()

  const textures = reactive<Record<PageId, string>>(
    PAGE_IDS.reduce((acc, id) => {
      acc[id] = ''
      return acc
    }, {} as Record<PageId, string>)
  )

  const renderingCount = ref(0)
  const isRendering = computed(() => renderingCount.value > 0)

  const pageElements = computed<Record<PageId, ZineElement[]>>(() =>
    PAGE_IDS.reduce((acc, id) => {
      acc[id] = state.value.pageElementIds[id]
        .map((elementId) => state.value.elements[elementId])
        .filter((element): element is ZineElement => Boolean(element))
      return acc
    }, {} as Record<PageId, ZineElement[]>)
  )

  const hasContent = computed<Record<PageId, boolean>>(() =>
    PAGE_IDS.reduce((acc, id) => {
      acc[id] = pageElements.value[id].length > 0
      return acc
    }, {} as Record<PageId, boolean>)
  )

  const filledCount = computed(() => PAGE_IDS.filter((id) => hasContent.value[id]).length)

  const pageKeys = computed<Record<PageId, string>>(() =>
    PAGE_IDS.reduce((acc, id) => {
      acc[id] = JSON.stringify(pageElements.value[id])
      return acc
    }, {} as Record<PageId, string>)
  )

  let isMounted = false
  let timerId: number | null = null
  const renderedKeys: Partial<Record<PageId, string>> = {}
  const versions: Partial<Record<PageId, number>> = {}

  async function renderDirtyPages() {
    if (!import.meta.client || !isMounted) return

    const dirtyIds = PAGE_IDS.filter((id) => renderedKeys[id] !== pageKeys.value[id])
    if (dirtyIds.length === 0) return

    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)

    await Promise.all(dirtyIds.map(async (pageId) => {
      const key = pageKeys.value[pageId]
      const version = (versions[pageId] ?? 0) + 1
      versions[pageId] = version
      renderingCount.value += 1

      try {
        const canvas = await renderPageCanvas(pageElements.value[pageId], {
          width: RENDER_WIDTH,
          pixelRatio
        })

        if (!canvas || !isMounted || versions[pageId] !== version) return

        textures[pageId] = canvas.toDataURL('image/png')
        renderedKeys[pageId] = key
      } catch {
        // Leave previous texture intact if an image fails to load.
      } finally {
        renderingCount.value = Math.max(0, renderingCount.value - 1)
      }
    }))
  }

  function scheduleRender(delay = DEBOUNCE_MS) {
    if (!isMounted) return

    if (timerId !== null) {
      window.clearTimeout(timerId)
    }

    timerId = window.setTimeout(() => {
      timerId = null
      void renderDirtyPages()
    }, delay)
  }

  onMounted(() => {
    isMounted = true
    scheduleRender(0)
  })

  onBeforeUnmount(() => {
    isMounted = false
    if (timerId !== null) {
      window.clearTimeout(timerId)
    }
  })

  watch(pageKeys, () => scheduleRender(), { deep: true, flush: 'post' })

  return {
    textures,
    hasContent,
    filledCount,
    isRendering
  }
}
