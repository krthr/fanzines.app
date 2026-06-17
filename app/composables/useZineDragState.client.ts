import { ref } from 'vue'

const isDragActive = ref(false)
let dragDepth = 0

export function useZineDragState() {
  function markDragEnter() {
    dragDepth += 1
    isDragActive.value = true
  }

  function markDragLeave() {
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) {
      isDragActive.value = false
    }
  }

  function resetDrag() {
    dragDepth = 0
    isDragActive.value = false
  }

  return {
    isDragActive,
    markDragEnter,
    markDragLeave,
    resetDrag
  }
}
