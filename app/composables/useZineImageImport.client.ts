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
  const { t } = useI18n()

  function formatSkippedFiles(files: ImageBatchSkippedFile[]) {
    const names = files
      .slice(0, 3)
      .map((file) => file.fileName || t('editor.import.unnamedFile'))
      .join(', ')
    const extraCount = files.length - 3

    return extraCount > 0 ? t('editor.import.andMore', { names, count: extraCount }) : names
  }

  function formatSkippedCount(count: number) {
    return t('editor.import.skipped', count)
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
        title: t('editor.import.failedTitle', failedFiles.length),
        description: t('editor.import.failedText', {
          skipped: formatSkippedCount(failedFiles.length),
          files: formatSkippedFiles(failedFiles)
        })
      })
    }

    if (result.overflowCount > 0) {
      toast.add({
        color: 'warning',
        title: t('editor.import.overflowTitle'),
        description: t('editor.import.overflowText', { skipped: formatSkippedCount(result.overflowCount) })
      })
    }

    if (result.largeFileCount > 0) {
      toast.add({
        color: 'warning',
        title: t('editor.import.largeTitle', result.largeFileCount),
        description: t('editor.import.largeText', result.largeFileCount)
      })
    }
  }

  return { processImageFiles }
}
