import type { PageId } from '~/types/zine'

type ZineAnalyticsValue = string | number | boolean | null | undefined
type ZineAnalyticsProperties = Record<string, ZineAnalyticsValue>

export type ZineAnalyticsEvent =
  | 'zine_editor_opened'
  | 'zine_page_selected'
  | 'zine_text_element_added'
  | 'zine_shape_element_added'
  | 'zine_page_layout_added'
  | 'zine_page_layout_removed'
  | 'zine_images_uploaded'
  | 'zine_element_deleted'
  | 'zine_pdf_export_started'
  | 'zine_pdf_export_succeeded'
  | 'zine_pdf_export_failed'
  | 'zine_reset_confirmed'

function cleanProperties(properties: ZineAnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  )
}

function normalizeException(error: unknown) {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)

  return new Error('Unknown client error', {
    cause: error
  })
}

export function useZineAnalytics() {
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const { proxy } = useScriptPostHog()
  // Not useI18n(): the error plugin calls this composable outside a component.
  const { $i18n } = useNuxtApp()

  const enabled = computed(() => {
    const posthogConfig = runtimeConfig.public.scripts?.posthog
    return typeof posthogConfig?.apiKey === 'string' && posthogConfig.apiKey.length > 0
  })

  function sharedProperties(properties: ZineAnalyticsProperties = {}) {
    return cleanProperties({
      app: 'fanzines',
      surface: 'zine_editor',
      route_path: route.path,
      locale: $i18n.locale.value,
      page_id: properties.page_id as PageId | undefined,
      ...properties
    })
  }

  function trackZineEvent(event: ZineAnalyticsEvent, properties: ZineAnalyticsProperties = {}) {
    if (!enabled.value) return
    proxy.posthog?.capture(event, sharedProperties(properties))
  }

  function trackZineException(error: unknown, properties: ZineAnalyticsProperties = {}) {
    if (!enabled.value) return
    proxy.posthog?.captureException(normalizeException(error), sharedProperties(properties))
  }

  return {
    trackZineEvent,
    trackZineException
  }
}
