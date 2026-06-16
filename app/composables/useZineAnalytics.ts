import type { PostHog } from 'posthog-js'

type ZineAnalyticsProperties = Record<string, string | number | boolean | null | undefined>
type NuxtAppWithPostHog = ReturnType<typeof useNuxtApp> & {
  $posthog?: () => PostHog
}

const zineAnalyticsBaseProperties = {
  app: 'fanzines',
  surface: 'zine_editor'
} satisfies ZineAnalyticsProperties

export function useZineAnalytics() {
  const nuxtApp = useNuxtApp() as NuxtAppWithPostHog

  function getPostHog() {
    return nuxtApp.$posthog?.()
  }

  function capture(event: string, properties: ZineAnalyticsProperties = {}) {
    getPostHog()?.capture(event, {
      ...zineAnalyticsBaseProperties,
      ...properties
    })
  }

  function captureException(error: unknown, properties: ZineAnalyticsProperties = {}) {
    getPostHog()?.captureException(error, {
      ...zineAnalyticsBaseProperties,
      ...properties
    })
  }

  return {
    capture,
    captureException
  }
}
