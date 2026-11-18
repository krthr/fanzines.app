import { ref } from 'vue'
import type { PageId } from '~/types/zine'

const isDragActive = ref(false)
// How many images are being dragged, when the browser says so before the drop:
// null when it does not, 0 when it reports files and none of them is an image.
const dragFileCount = ref<number | null>(null)
// The thumbnail under the pointer: a drop there starts the batch at that page.
const dragStartPageId = ref<PageId | null>(null)
let dragDepth = 0

function countDraggedFiles(event: DragEvent): number | null {
  const items = Array.from(event.dataTransfer?.items ?? [])
  const files = items.filter((item) => item.kind === 'file')
  if (files.length === 0) return null

  // A file with no reported type may still be an image; the import decides.
  return files.filter((item) => item.type === '' || item.type.startsWith('image/')).length
}

export function useZineDragState() {
  function markDragEnter(event?: DragEvent) {
    dragDepth += 1
    isDragActive.value = true

    if (event) {
      dragFileCount.value = countDraggedFiles(event) ?? dragFileCount.value
    }
  }

  function markDragLeave() {
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) {
      resetDrag()
    }
  }

  function resetDrag() {
    dragDepth = 0
    isDragActive.value = false
    dragFileCount.value = null
    dragStartPageId.value = null
  }

  return {
    isDragActive,
    dragFileCount,
    dragStartPageId,
    markDragEnter,
    markDragLeave,
    resetDrag
  }
}
