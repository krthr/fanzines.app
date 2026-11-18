import { ref } from 'vue'
import type { PageId } from '~/types/zine'

const isDragActive = ref(false)
// How many files are being dragged, when the browser exposes it before the drop.
const dragFileCount = ref<number | null>(null)
// The thumbnail under the pointer: a drop there starts the batch at that page.
const dragStartPageId = ref<PageId | null>(null)
let dragDepth = 0

function countDraggedFiles(event: DragEvent): number | null {
  const items = Array.from(event.dataTransfer?.items ?? [])
  const files = items.filter((item) => item.kind === 'file')
  const images = files.filter((item) => item.type === '' || item.type.startsWith('image/'))
  const count = images.length || files.length

  return count > 0 ? count : null
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
