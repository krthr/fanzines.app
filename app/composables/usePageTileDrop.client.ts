import type { PageId } from '~/types/zine'
import { useZineImageImport } from '~/composables/useZineImageImport.client'
import { useZineDragState } from '~/composables/useZineDragState.client'

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes('Files'))
}

// Dropping files on a page miniature starts the batch at that page.
export function usePageTileDrop() {
  const { processImageFiles } = useZineImageImport()
  const { dragStartPageId, resetDrag } = useZineDragState()

  function onTileDragOver(event: DragEvent, pageId: PageId) {
    if (!isFileDrag(event)) return
    event.preventDefault()
    dragStartPageId.value = pageId
  }

  function onTileDragLeave(event: DragEvent, pageId: PageId) {
    if (!isFileDrag(event)) return

    // Moving between the miniature and its label is not leaving the tile.
    const tile = event.currentTarget as Element | null
    if (tile && event.relatedTarget instanceof Node && tile.contains(event.relatedTarget)) return

    if (dragStartPageId.value === pageId) dragStartPageId.value = null
  }

  function onTileDrop(event: DragEvent, pageId: PageId) {
    if (!isFileDrag(event)) return
    event.preventDefault()
    event.stopPropagation()
    resetDrag()
    const files = Array.from(event.dataTransfer?.files ?? [])
    void processImageFiles(files, { inputMethod: 'drag_drop', dropTarget: 'page_tile', startPageId: pageId })
  }

  return {
    onTileDragOver,
    onTileDragLeave,
    onTileDrop
  }
}
