import type { PageId } from '~/types/zine'
import { useZineImageImport } from '~/composables/useZineImageImport.client'
import { useZineDragState } from '~/composables/useZineDragState.client'
import { usePageLayouts } from '~/composables/usePageLayouts.client'

function isFileDrag(event: DragEvent): boolean {
  return Boolean(event.dataTransfer?.types.includes('Files'))
}

// Dropping files on a page miniature starts the batch at that page; dropping a layout
// card adds that layout to it.
export function usePageTileDrop() {
  const { processImageFiles } = useZineImageImport()
  const { dragStartPageId, resetDrag } = useZineDragState()
  const { onLayoutDragOver, onLayoutDragLeave, onLayoutDrop } = usePageLayouts()

  function onTileDragOver(event: DragEvent, pageId: PageId) {
    if (onLayoutDragOver(event, pageId) || !isFileDrag(event)) return
    event.preventDefault()
    dragStartPageId.value = pageId
  }

  function onTileDragLeave(event: DragEvent, pageId: PageId) {
    if (onLayoutDragLeave(event, pageId) || !isFileDrag(event)) return

    // Moving between the miniature and its label is not leaving the tile.
    const tile = event.currentTarget as Element | null
    if (tile && event.relatedTarget instanceof Node && tile.contains(event.relatedTarget)) return

    if (dragStartPageId.value === pageId) dragStartPageId.value = null
  }

  function onTileDrop(event: DragEvent, pageId: PageId) {
    if (onLayoutDrop(event, pageId, 'page_tile') || !isFileDrag(event)) return
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
