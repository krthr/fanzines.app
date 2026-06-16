import type { Group } from "konva/lib/Group";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import type { ImageElement, TextElement, ZineElement } from "~/types/zine";
import { loadCachedHtmlImage } from "~/utils/zineImageCache";

function createImageNode(element: ImageElement, image: HTMLImageElement) {
  return new KonvaImage({
    image,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    listening: false,
  });
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
    wrap: "word",
    listening: false,
  });
}

export async function createElementNode(element: ZineElement) {
  if (element.type === "image") {
    const image = await loadCachedHtmlImage(element.src);
    return createImageNode(element, image);
  }

  return createTextNode(element);
}

export async function renderElementsIntoGroup(
  group: Group,
  elements: ZineElement[],
) {
  for (const element of elements) {
    group.add(await createElementNode(element));
  }
}
