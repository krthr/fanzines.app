type ZineAnalyticsProperties = Record<string, string | number | boolean | null | undefined>

const zineAnalyticsBaseProperties = {
  app: 'fanzines',
  surface: 'zine_editor'
} satisfies ZineAnalyticsProperties

export function useZineAnalytics() {
  const posthog = usePostHog()

  function capture(event: string, properties: ZineAnalyticsProperties = {}) {
    posthog?.capture(event, {
      ...zineAnalyticsBaseProperties,
      ...properties
    })
  }

  function captureException(error: unknown, properties: ZineAnalyticsProperties = {}) {
    posthog?.captureException(error, {
      ...zineAnalyticsBaseProperties,
      ...properties
    })
  }

  return {
    capture,
    captureException
  }
}
