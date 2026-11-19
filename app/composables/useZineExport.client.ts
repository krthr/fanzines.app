import { ref } from 'vue'
import { useZineStore } from '~/composables/useZineStore'
import { useZineAnalytics } from '~/composables/useZineAnalytics.client'

export type ExportInputMethod = 'review' | 'pdf_ready_dialog'

const isExporting = ref(false)
const exportError = ref('')

export function useZineExport() {
  const { state, elementCount } = useZineStore()
  const { trackZineEvent, trackZineException } = useZineAnalytics()
  const { t } = useI18n()

  // Resolves to true when the PDF was generated and handed to the browser.
  async function exportPdf(inputMethod: ExportInputMethod): Promise<boolean> {
    if (isExporting.value) return false

    exportError.value = ''
    isExporting.value = true
    const startedAt = performance.now()

    trackZineEvent('zine_pdf_export_started', {
      page_id: state.value.selectedPageId,
      element_count: elementCount.value,
      export_guides: state.value.exportGuides,
      export_safe_margins: state.value.exportSafeMargins !== false,
      input_method: inputMethod
    })

    try {
      const { exportZinePdf } = await import('~/utils/exportPdf.client')
      await exportZinePdf(state.value)
      trackZineEvent('zine_pdf_export_succeeded', {
        page_id: state.value.selectedPageId,
        element_count: elementCount.value,
        export_guides: state.value.exportGuides,
        export_safe_margins: state.value.exportSafeMargins !== false,
        input_method: inputMethod,
        duration_ms: Math.round(performance.now() - startedAt)
      })

      return true
    } catch (error) {
      exportError.value = t('editor.export.failed')
      trackZineEvent('zine_pdf_export_failed', {
        page_id: state.value.selectedPageId,
        element_count: elementCount.value,
        export_guides: state.value.exportGuides,
        export_safe_margins: state.value.exportSafeMargins !== false,
        input_method: inputMethod,
        duration_ms: Math.round(performance.now() - startedAt)
      })
      trackZineException(error, {
        error_source: 'pdf_export',
        page_id: state.value.selectedPageId,
        element_count: elementCount.value
      })

      return false
    } finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,
    exportError,
    exportPdf
  }
}
