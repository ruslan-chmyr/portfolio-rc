import { PROJECT_BOOK_META } from '../model/projectBookConfig'
import type { ProjectBookEntry } from '../model/projectBookData'

export type BookSheetFace =
  | { kind: 'cover' }
  | { kind: 'backCover' }
  | { kind: 'visual'; entry: ProjectBookEntry }
  | { kind: 'detail'; entry: ProjectBookEntry }

export type BookSheet = {
  id: string
  front: BookSheetFace
  back: BookSheetFace
}

/**
 * Map projects to physical sheets (reference book-slider pairing):
 * - Sheet 0: cover | first visual
 * - Sheet i: project[i-1] detail | project[i] visual
 * - Last sheet: last detail | back cover
 *
 * Page index 0 = closed; page index === sheets.length = fully open on back.
 */
export function buildBookSheets(
  entries: readonly ProjectBookEntry[],
): BookSheet[] {
  if (entries.length === 0) {
    return [
      {
        id: 'empty-cover',
        front: { kind: 'cover' },
        back: { kind: 'backCover' },
      },
    ]
  }

  const sheets: BookSheet[] = [
    {
      id: `cover-${entries[0]!.id}`,
      front: { kind: 'cover' },
      back: { kind: 'visual', entry: entries[0]! },
    },
  ]

  for (let i = 0; i < entries.length - 1; i += 1) {
    const current = entries[i]!
    const next = entries[i + 1]!
    sheets.push({
      id: `spread-${current.id}-${next.id}`,
      front: { kind: 'detail', entry: current },
      back: { kind: 'visual', entry: next },
    })
  }

  const last = entries[entries.length - 1]!
  sheets.push({
    id: `closing-${last.id}`,
    front: { kind: 'detail', entry: last },
    back: { kind: 'backCover' },
  })

  return sheets
}

/** Active project while reading (page > 0). */
export function projectIndexForPage(
  page: number,
  entryCount: number,
): number | null {
  if (entryCount <= 0 || page <= 0) return null
  return Math.min(entryCount - 1, page - 1)
}

export function bookSheetCount(entryCount: number): number {
  return entryCount <= 0 ? 1 : entryCount + 1
}

export function maxPageIndex(sheetCount: number): number {
  return sheetCount
}

export function coverLabel(): string {
  return `${PROJECT_BOOK_META.coverTitle} · ${PROJECT_BOOK_META.years}`
}
