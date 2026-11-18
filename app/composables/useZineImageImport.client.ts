import type { ImageBatchSkippedFile, PageId } from '~/types/zine'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'

// 'file_picker' is the top bar button and a click on an empty page, as before.
export type ImageInputMethod = 'file_picker' | 'empty_state_button' | 'mobile_bar' | 'drag_drop'
export type ImageDropTarget = 'canvas' | 'page_tile' | 'shell'

export type ProcessImageFilesOptions = {
  inputMethod: ImageInputMethod
  dropTarget?: ImageDropTarget
  startPageId?: PageId
}

export function useZineImageImport() {
  const { state, elementCount, addImageElements } = useZineStore()
  const { trackZineEvent } = useZineAnalytics()
  const toast = useToast()

  function formatSkippedFiles(files: ImageBatchSkippedFile[]) {
    const names = files.slice(0, 3).map((file) => file.fileName).join(', ')
    const extraCount = files.length - 3

    return extraCount > 0 ? `${names} y ${extraCount} más` : names
  }

  function formatSkippedCount(count: number) {
    return count === 1 ? 'Se omitió 1 archivo' : `Se omitieron ${count} archivos`
  }

  async function processImageFiles(files: File[], options: ProcessImageFilesOptions) {
    if (files.length === 0) return

    const initialPageId = options.startPageId ?? state.value.selectedPageId
    const result = await addImageElements(files, options.startPageId)
    const failedFiles = result.skippedFiles.filter((file) => file.reason !== 'no-page')
    const skippedCount = result.skippedFiles.length

    trackZineEvent('zine_images_uploaded', {
      page_id: initialPageId,
      input_method: options.inputMethod,
      drop_target: options.dropTarget,
      file_count: files.length,
      imported_count: result.importedCount,
      skipped_count: skippedCount,
      failed_count: failedFiles.length,
      overflow_count: result.overflowCount,
      large_file_count: result.largeFileCount,
      status: result.importedCount === files.length ? 'succeeded' : result.importedCount > 0 ? 'partial' : 'failed',
      element_count: elementCount.value
    })

    if (failedFiles.length > 0) {
      toast.add({
        color: 'error',
        title: failedFiles.length === 1 ? 'Imagen no cargada' : 'Algunas imágenes no se cargaron',
        description: `${formatSkippedCount(failedFiles.length)}: ${formatSkippedFiles(failedFiles)}.`
      })
    }

    if (result.overflowCount > 0) {
      toast.add({
        color: 'warning',
        title: 'No caben todas las imágenes',
        description: `${formatSkippedCount(result.overflowCount)} porque no quedaban páginas disponibles.`
      })
    }

    if (result.largeFileCount > 0) {
      toast.add({
        color: 'warning',
        title: result.largeFileCount === 1 ? 'Imagen grande' : 'Imágenes grandes',
        description: result.largeFileCount === 1
          ? 'La imagen es grande; si notas lentitud, conviene usar una versión reducida.'
          : `${result.largeFileCount} imágenes son grandes; si notas lentitud, conviene usar versiones reducidas.`
      })
    }
  }

  return { processImageFiles }
}
