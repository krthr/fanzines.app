import { Group } from 'konva/lib/Group'
import { Layer } from 'konva/lib/Layer'
import { Stage } from 'konva/lib/Stage'
import { Rect } from 'konva/lib/shapes/Rect'
import type { ZineElement } from '~/types/zine'
import { PAGE_H, PAGE_W } from '~/utils/zineLayout'
import { createOffscreenContainer } from '~/utils/renderSheet.client'
import { renderElementsIntoGroup } from '~/utils/renderZine.client'

type RenderPageOptions = {
  // Width of the page in CSS pixels; the height follows the panel ratio.
  width: number
  pixelRatio?: number
}

// Renders one page with the same nodes the sheet and the PDF use, so thumbnails
// and the facing page match what gets printed.
export async function renderPageCanvas(elements: ZineElement[], options: RenderPageOptions) {
  if (!import.meta.client) return null

  const scale = options.width / PAGE_W
  const width = options.width
  const height = PAGE_H * scale
  const container = createOffscreenContainer(width, height)
  const stage = new Stage({ container, width, height })

  try {
    const layer = new Layer()
    const root = new Group({ scaleX: scale, scaleY: scale })

    stage.add(layer)
    layer.add(root)
    root.add(new Rect({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      fill: '#ffffff',
      listening: false
    }))

    await renderElementsIntoGroup(root, elements)
    layer.draw()

    return stage.toCanvas({ pixelRatio: options.pixelRatio ?? 1 })
  } finally {
    stage.destroy()
    container.remove()
  }
}
