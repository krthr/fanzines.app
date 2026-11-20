import type { Group } from 'konva/lib/Group'
import { Shape } from 'konva/lib/Shape'
import { Image as KonvaImage } from 'konva/lib/shapes/Image'
import { Line } from 'konva/lib/shapes/Line'
import { Rect } from 'konva/lib/shapes/Rect'
import { Text as KonvaText } from 'konva/lib/shapes/Text'
import type { ImageElement, TextElement, ZineElement } from '~/types/zine'
import { loadCachedHtmlImage } from '~/utils/zineImageCache'
import { circleNodeConfig, lineNodeConfig, patternNodeConfig, rectNodeConfig } from '~/utils/zineShapes'

function createImageNode(element: ImageElement, image: HTMLImageElement) {
  return new KonvaImage({
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
  return new KonvaText({
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

type TextMeasure = Pick<TextElement, 'text' | 'width' | 'fontFamily' | 'fontSize' | 'fontStyle' | 'lineHeight'>

// The height a text box needs to draw all its lines. Konva draws only the lines that
// fit the box, adding their heights one by one, so the box gets a unit of slack: at
// exactly the sum, rounding can leave the last line out.
export function fitTextHeight(element: TextMeasure) {
  return Math.ceil(measureTextHeight(element)) + 1
}

// The height a text takes when nothing cuts it short.
function measureTextHeight(element: TextMeasure) {
  const node = new KonvaText({
    text: element.text,
    width: element.width,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontStyle: element.fontStyle,
    lineHeight: element.lineHeight,
    wrap: 'word'
  })
  const height = node.height()

  node.destroy()
  return height
}

export async function createElementNode(element: ZineElement) {
  switch (element.type) {
    case 'image':
      return createImageNode(element, await loadCachedHtmlImage(element.src))
    case 'text':
      return createTextNode(element)
    case 'rect':
      return new Rect({ ...rectNodeConfig(element), listening: false })
    case 'circle':
      return new Shape({ ...circleNodeConfig(element), listening: false })
    case 'line':
      return new Line({ ...lineNodeConfig(element), listening: false })
    case 'pattern':
      return new Shape({ ...patternNodeConfig(element), listening: false })
  }
}

export async function renderElementsIntoGroup(group: Group, elements: ZineElement[]) {
  for (const element of elements) {
    group.add(await createElementNode(element))
  }
}
