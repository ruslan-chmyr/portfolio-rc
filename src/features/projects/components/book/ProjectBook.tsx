import { useMemo } from 'react'
import { buildBookSheets } from '../../lib/buildBookSheets'
import { useDelayedBookPage } from '../../lib/useDelayedBookPage'
import type { ProjectBookEntry } from '../../model/projectBookData'
import { SkinnedBookPage } from './SkinnedBookPage'

type ProjectBookProps = {
  entries: readonly ProjectBookEntry[]
  page: number
  reducedMotion: boolean
  onPageChange: (page: number) => void
}

/**
 * SkinnedMesh book — animation mechanics from the MIT reference
 * animated-book-slider-threejs (Wawa Sensei tutorial pattern).
 */
export function ProjectBook({
  entries,
  page,
  reducedMotion,
  onPageChange,
}: ProjectBookProps) {
  const sheets = useMemo(() => buildBookSheets(entries), [entries])
  const delayedPage = useDelayedBookPage(page, reducedMotion)
  const sheetCount = sheets.length

  return (
    <group rotation-y={-Math.PI / 2}>
      {sheets.map((sheet, index) => (
        <SkinnedBookPage
          key={sheet.id}
          sheet={sheet}
          number={index}
          page={delayedPage}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === sheetCount}
          sheetCount={sheetCount}
          reducedMotion={reducedMotion}
          onSelect={onPageChange}
        />
      ))}
    </group>
  )
}
