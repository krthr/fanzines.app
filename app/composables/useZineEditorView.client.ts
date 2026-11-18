import { computed, ref } from 'vue'
import { PAGE_IDS, type PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZineDragState } from '~/composables/useZineDragState.client'
import { getFacingPageId } from '~/utils/zineLayout'

export type EditorMode = 'design' | 'review'
export type SidebarView = 'reading' | 'sheet'

// View state only: none of this is part of the zine, and none of it is exported.
const mode = ref<EditorMode>('design')
const sidebarView = ref<SidebarView>('reading')
const prefersSpread = ref(true)
const isPdfReadyOpen = ref(false)
const isEditingText = ref(false)

export function useZineEditorView() {
  const { state } = useZineStore()
  const { isDragActive, dragFileCount, dragStartPageId } = useZineDragState()

  const pageIndex = computed(() => PAGE_IDS.indexOf(state.value.selectedPageId))
  const previousPageId = computed<PageId | null>(() => PAGE_IDS[pageIndex.value - 1] ?? null)
  const nextPageId = computed<PageId | null>(() => PAGE_IDS[pageIndex.value + 1] ?? null)

  const facingPageId = computed(() => getFacingPageId(state.value.selectedPageId))
  const canShowSpread = computed(() => facingPageId.value !== null)
  const showsSpread = computed(() => prefersSpread.value && canShowSpread.value)

  const filledPageIds = computed(() => PAGE_IDS.filter((id) => state.value.pageElementIds[id].length > 0))

  // One image per page, from the start page onward, in reading order.
  const dropStartPageId = computed(() => dragStartPageId.value ?? state.value.selectedPageId)
  const dropTargetPageIds = computed<PageId[]>(() => {
    if (!isDragActive.value) return []

    const start = PAGE_IDS.indexOf(dropStartPageId.value)
    return PAGE_IDS.slice(start, start + (dragFileCount.value ?? 1))
  })

  function resetView() {
    mode.value = 'design'
    isPdfReadyOpen.value = false
    isEditingText.value = false
  }

  return {
    mode,
    sidebarView,
    prefersSpread,
    isPdfReadyOpen,
    isEditingText,
    pageIndex,
    previousPageId,
    nextPageId,
    facingPageId,
    canShowSpread,
    showsSpread,
    filledPageIds,
    dropStartPageId,
    dropTargetPageIds,
    resetView
  }
}
