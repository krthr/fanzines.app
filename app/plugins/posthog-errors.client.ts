const RECENT_ERROR_TTL_MS = 1500

function getErrorKey(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}:${error.message}:${error.stack?.split('\n')[1] ?? ''}`
  }

  return String(error)
}

export default defineNuxtPlugin((nuxtApp) => {
  const { trackZineException } = useZineAnalytics()
  const seenObjects = new WeakSet<object>()
  const recentKeys = new Map<string, number>()
  const existingErrorHandler = nuxtApp.vueApp.config.errorHandler

  function shouldSkip(error: unknown) {
    if (error && typeof error === 'object') {
      if (seenObjects.has(error)) return true
      seenObjects.add(error)
    }

    const key = getErrorKey(error)
    const now = Date.now()
    const lastSeenAt = recentKeys.get(key)

    if (lastSeenAt && now - lastSeenAt < RECENT_ERROR_TTL_MS) {
      return true
    }

    recentKeys.set(key, now)

    for (const [recentKey, seenAt] of recentKeys) {
      if (now - seenAt > RECENT_ERROR_TTL_MS) {
        recentKeys.delete(recentKey)
      }
    }

    return false
  }

  function capture(error: unknown, source: string, info?: string) {
    if (shouldSkip(error)) return

    trackZineException(error, {
      error_source: source,
      vue_info: info
    })
  }

  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    capture(error, 'vue_error_handler', info)

    if (existingErrorHandler) {
      existingErrorHandler(error, instance, info)
    } else {
      console.error(error)
    }
  }

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    capture(error, 'vue_error_hook', info)
  })

  nuxtApp.hook('app:error', (error) => {
    capture(error, 'app_error_hook')
  })
})
