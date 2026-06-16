const imageCache = new Map<string, Promise<HTMLImageElement>>()

export function loadCachedHtmlImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached) return cached

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    if (!import.meta.client) {
      reject(new Error('Image loading is only available in the browser.'))
      return
    }

    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => {
      imageCache.delete(src)
      reject(new Error('Project image could not be loaded.'))
    }
    image.src = src
  })

  imageCache.set(src, promise)
  return promise
}

export function forgetCachedHtmlImage(src: string) {
  imageCache.delete(src)
}

export function pruneCachedHtmlImages(activeSources: Set<string>) {
  for (const src of imageCache.keys()) {
    if (!activeSources.has(src)) {
      imageCache.delete(src)
    }
  }
}

export function clearCachedHtmlImages() {
  imageCache.clear()
}
