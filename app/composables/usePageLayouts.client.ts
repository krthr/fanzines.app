import { computed, ref } from 'vue'
import type { PageId, ZineElementDraft } from '~/types/zine'
import { getPageLayout, type PageLayoutCopy, type PageLayoutId } from '~/utils/pageLayouts'
import { fitTextHeight } from '~/utils/renderZine.client'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'
import { useZinePageLabels } from '~/composables/useZinePageLabels'

// A layout card being dragged carries its id under this type, so the editor never takes
// it for a photo being dropped (those carry 'Files').
export const PAGE_LAYOUT_MIME = 'application/x-fanzines-page-layout'

export type LayoutInputMethod = 'click' | 'drag_drop'
export type LayoutDropTarget = 'canvas' | 'facing_page' | 'page_tile'
export type LayoutRemoveMethod = 'toast' | 'inspector'

// One layout added to one page: the elements it created, so it can be taken back.
type LayoutStamp = {
  key: number
  layoutId: PageLayoutId
  pageId: PageId
  elementIds: string[]
  toastId?: string | number
}

// View state only, like useZineEditorView: none of it is part of the zine.
const stamps = ref<LayoutStamp[]>([])
const draggedLayoutId = ref<PageLayoutId | null>(null)
// The page a dragged layout would land on if it were dropped now.
const layoutDropPageId = ref<PageId | null>(null)
let stampCount = 0

// What the page miniatures need while a card is dragged, without the rest.
export function useLayoutDragState() {
  return { draggedLayoutId, layoutDropPageId }
}

export function isLayoutDrag(event: DragEvent) {
  return Boolean(event.dataTransfer?.types.includes(PAGE_LAYOUT_MIME))
}

function isPageLayoutId(value: string): value is PageLayoutId {
  return Boolean(getPageLayout(value))
}

export function usePageLayouts() {
  const { state, elementCount, addElementDrafts, deleteElements } = useZineStore()
  const { t, locale } = useI18n()
  const toast = useToast()
  const { trackZineEvent } = useZineAnalytics()
  const { pagePlace } = useZinePageLabels()

  function layoutName(layoutId: PageLayoutId) {
    return t(`editor.layouts.names.${layoutId}`)
  }

  // Texts are written in the editor's language when the layout is added; the year and
  // the month are today's.
  function layoutCopy(layoutId: PageLayoutId): PageLayoutCopy {
    const now = new Date()
    const params = {
      year: now.getFullYear(),
      month: new Intl.DateTimeFormat(locale.value, { month: 'short', year: 'numeric' }).format(now).toUpperCase()
    }

    return (key) => t(`editor.layouts.copy.${layoutId}.${key}`, params)
  }

  function buildLayout(layoutId: PageLayoutId): ZineElementDraft[] {
    return getPageLayout(layoutId)?.build(layoutCopy(layoutId)) ?? []
  }

  // A text box only draws the lines that fit it, so one that wraps more in this
  // language than the layout planned for grows to show them all.
  function fitTextHeights(drafts: ZineElementDraft[]) {
    return drafts.map((draft) => draft.type === 'text'
      ? { ...draft, height: Math.max(draft.height, fitTextHeight(draft)) }
      : draft)
  }

  function trackRemoval(stamp: LayoutStamp, inputMethod: LayoutRemoveMethod) {
    trackZineEvent('zine_page_layout_removed', {
      page_id: stamp.pageId,
      layout_id: stamp.layoutId,
      input_method: inputMethod,
      element_count: elementCount.value
    })
  }

  // Only what is still on the page is taken back, and only that counts as a removal.
  function removeStamp(stamp: LayoutStamp, inputMethod: LayoutRemoveMethod) {
    const remaining = stamp.elementIds.filter((id) => state.value.elements[id])

    deleteElements(remaining)
    stamps.value = stamps.value.filter((item) => item.key !== stamp.key)

    if (inputMethod !== 'toast' && stamp.toastId !== undefined) {
      toast.remove(stamp.toastId)
    }

    if (remaining.length > 0) trackRemoval(stamp, inputMethod)
  }

  // A reset leaves nothing to take back: the history and its toasts go with the zine.
  function forgetLayouts() {
    for (const stamp of stamps.value) {
      if (stamp.toastId !== undefined) toast.remove(stamp.toastId)
    }

    stamps.value = []
  }

  // Appends the layout on top of what the page has, so a text layout lands over a photo
  // instead of replacing it. The toast and the inspector can take it back.
  function applyLayout(layoutId: PageLayoutId, pageId: PageId, inputMethod: LayoutInputMethod, dropTarget?: LayoutDropTarget) {
    const elementIds = addElementDrafts(pageId, fitTextHeights(buildLayout(layoutId)))
    const stamp: LayoutStamp = { key: ++stampCount, layoutId, pageId, elementIds }

    stamps.value.push(stamp)
    trackZineEvent('zine_page_layout_added', {
      page_id: pageId,
      layout_id: layoutId,
      input_method: inputMethod,
      drop_target: dropTarget,
      layout_element_count: elementIds.length,
      element_count: elementCount.value
    })

    stamp.toastId = toast.add({
      title: t('editor.layouts.added', { layout: layoutName(layoutId) }),
      description: t('editor.layouts.addedTo', { layout: layoutName(layoutId), page: pagePlace(pageId) }),
      actions: [{
        label: t('editor.layouts.undo'),
        icon: 'i-lucide-undo-2',
        color: 'neutral',
        variant: 'outline',
        onClick: () => removeStamp(stamp, 'toast')
      }]
    }).id
  }

  // The latest layout added to the open page that still has something on it.
  const lastStamp = computed(() => {
    const pageId = state.value.selectedPageId

    for (let index = stamps.value.length - 1; index >= 0; index--) {
      const stamp = stamps.value[index]
      if (stamp?.pageId === pageId && stamp.elementIds.some((id) => state.value.elements[id])) return stamp
    }

    return null
  })

  // ── Drag and drop ─────────────────────────────────────────────────────────

  function startLayoutDrag(event: DragEvent, layoutId: PageLayoutId) {
    if (!event.dataTransfer) return

    event.dataTransfer.setData(PAGE_LAYOUT_MIME, layoutId)
    event.dataTransfer.effectAllowed = 'copy'
    draggedLayoutId.value = layoutId
  }

  function endLayoutDrag() {
    draggedLayoutId.value = null
    layoutDropPageId.value = null
  }

  // Each returns false when the drag is not a layout, so the caller can try files.
  function onLayoutDragOver(event: DragEvent, pageId: PageId) {
    if (!isLayoutDrag(event)) return false

    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    layoutDropPageId.value = pageId
    return true
  }

  function onLayoutDragLeave(event: DragEvent, pageId: PageId) {
    if (!isLayoutDrag(event)) return false

    // Moving onto a child of the target is not leaving it.
    const target = event.currentTarget as Element | null
    if (target && event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return true

    if (layoutDropPageId.value === pageId) layoutDropPageId.value = null
    return true
  }

  function onLayoutDrop(event: DragEvent, pageId: PageId, dropTarget: LayoutDropTarget) {
    if (!isLayoutDrag(event)) return false

    event.preventDefault()
    event.stopPropagation()

    const layoutId = event.dataTransfer?.getData(PAGE_LAYOUT_MIME) ?? ''
    if (isPageLayoutId(layoutId)) applyLayout(layoutId, pageId, 'drag_drop', dropTarget)

    endLayoutDrag()
    return true
  }

  return {
    draggedLayoutId,
    layoutDropPageId,
    lastStamp,
    layoutName,
    buildLayout,
    applyLayout,
    removeStamp,
    forgetLayouts,
    startLayoutDrag,
    endLayoutDrag,
    onLayoutDragOver,
    onLayoutDragLeave,
    onLayoutDrop
  }
}
