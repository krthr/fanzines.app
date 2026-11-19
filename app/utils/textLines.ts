// A title is one message with a row per line. Every row but the last keeps a trailing
// space, so the rows still read as separate words where the line breaks are lost
// (the Markdown twin of a page, a copied title).
export function toLines(text: string) {
  const lines = text.split('\n')
  return lines.map((line, index) => index < lines.length - 1 ? `${line} ` : line)
}
