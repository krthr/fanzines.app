import Konva from 'konva'
import type { ImageElement, TextElement, ZineElement } from '~/types/zine'

const imageCache = new Map<string, Promise<HTMLImageElement>>()

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached) return cached

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar una imagen del proyecto.'))
    image.src = src
  })

  imageCache.set(src, promise)
  return promise
}

function createImageNode(element: ImageElement, image: HTMLImageElement) {
  return new Konva.Image({
    image,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    listening: false
  })
}

function createTextNode(element: TextElement) {
  return new Konva.Text({
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    text: element.text,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontStyle: element.fontStyle,
    fill: element.fill,
    align: element.align,
    lineHeight: element.lineHeight,
    wrap: 'word',
    listening: false
  })
}

export async function createElementNode(element: ZineElement) {
  if (element.type === 'image') {
    const image = await loadHtmlImage(element.src)
    return createImageNode(element, image)
  }

  return createTextNode(element)
}

export async function renderElementsIntoGroup(group: Konva.Group, elements: ZineElement[]) {
  for (const element of elements) {
    group.add(await createElementNode(element))
  }
}
