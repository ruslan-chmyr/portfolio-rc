import { describe, expect, it } from 'vitest'
import type { ProjectBookEntry } from '../model/projectBookData'
import {
  bookSheetCount,
  buildBookSheets,
  maxPageIndex,
  projectIndexForPage,
} from './buildBookSheets'

function entry(id: string): ProjectBookEntry {
  return {
    id,
    number: id,
    title: id,
    summary: id,
    technologies: [],
    coverImage: `cover:${id}`,
  }
}

describe('buildBookSheets', () => {
  it('builds cover + N project sheets with paired faces', () => {
    const sheets = buildBookSheets([entry('a'), entry('b'), entry('c')])
    expect(sheets).toHaveLength(4)
    expect(sheets[0]!.front.kind).toBe('cover')
    expect(sheets[0]!.back).toMatchObject({ kind: 'visual', entry: { id: 'a' } })
    expect(sheets[1]!.front).toMatchObject({ kind: 'detail', entry: { id: 'a' } })
    expect(sheets[1]!.back).toMatchObject({ kind: 'visual', entry: { id: 'b' } })
    expect(sheets[3]!.front).toMatchObject({ kind: 'detail', entry: { id: 'c' } })
    expect(sheets[3]!.back.kind).toBe('backCover')
  })

  it('maps page index to the active project', () => {
    expect(projectIndexForPage(0, 3)).toBeNull()
    expect(projectIndexForPage(1, 3)).toBe(0)
    expect(projectIndexForPage(3, 3)).toBe(2)
    expect(maxPageIndex(bookSheetCount(3))).toBe(4)
  })
})
