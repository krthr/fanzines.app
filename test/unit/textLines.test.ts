import { describe, expect, it } from 'vitest'
import { toLines } from '~/utils/textLines'

describe('toLines', () => {
  it('returns a single empty line for an empty string without adding a space', () => {
    expect(toLines('')).toEqual([''])
  })

  it('keeps a single-line string unchanged', () => {
    expect(toLines('Una sola línea.')).toEqual(['Una sola línea.'])
  })

  it('adds a trailing space to every line except the last', () => {
    expect(toLines('Una hoja.\nOcho páginas.\nTu fanzine.')).toEqual([
      'Una hoja. ',
      'Ocho páginas. ',
      'Tu fanzine.'
    ])
    expect(toLines('From the browser\nto the table.').join('')).toBe('From the browser to the table.')
  })

  it('handles leading, trailing and consecutive newlines', () => {
    expect(toLines('\nhello')).toEqual([' ', 'hello'])
    expect(toLines('hello\n')).toEqual(['hello ', ''])
    expect(toLines('a\n\nb')).toEqual(['a ', ' ', 'b'])
    expect(toLines('\n')).toEqual([' ', ''])
  })

  it('preserves existing trailing spaces on non-final lines', () => {
    expect(toLines('hello \nworld')).toEqual(['hello  ', 'world'])
  })
})
