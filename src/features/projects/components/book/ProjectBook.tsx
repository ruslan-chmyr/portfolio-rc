import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { buildBookSheets } from '../../lib/buildBookSheets'
import { useDelayedBookPage } from '../../lib/useDelayedBookPage'
import type { ProjectBookEntry } from '../../model/projectBookData'
import { SkinnedBookPage } from './SkinnedBookPage'

type ProjectBookProps = {
  entries: readonly ProjectBookEntry[]
  page: number
  reducedMotion: boolean
  onPageChange: (page: number) => void
  /** Visual (delayed) page — used for closing-lock / settle coordination. */
  onVisualPageChange?: (visualPage: number) => void
  /** True when delayed page matches target and all sheet bones have converged. */
  onBonesSettledChange?: (settled: boolean) => void
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
  onVisualPageChange,
  onBonesSettledChange,
}: ProjectBookProps) {
  const sheets = useMemo(() => buildBookSheets(entries), [entries])
  const delayedPage = useDelayedBookPage(page, reducedMotion)
  const sheetCount = sheets.length
  const unsettled = useRef(new Set<number>())
  const [bonesSettled, setBonesSettled] = useState(false)

  // Invalidate bone settle before the parent observes the new visual page.
  // Otherwise closingLock can unlock on a stale bonesSettled=true when
  // visualPage hits 0 in the same commit, before useFrame marks sheets unsettled.
  useLayoutEffect(() => {
    setBonesSettled(false)
    onBonesSettledChange?.(false)
  }, [delayedPage, onBonesSettledChange])

  useEffect(() => {
    onVisualPageChange?.(delayedPage)
  }, [delayedPage, onVisualPageChange])

  useEffect(() => {
    onBonesSettledChange?.(bonesSettled)
  }, [bonesSettled, onBonesSettledChange])

  const onSettledChange = useCallback((sheetIndex: number, settled: boolean) => {
    if (settled) unsettled.current.delete(sheetIndex)
    else unsettled.current.add(sheetIndex)
    const next = unsettled.current.size === 0
    setBonesSettled((prev) => (prev === next ? prev : next))
  }, [])

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
          onSettledChange={onSettledChange}
        />
      ))}
    </group>
  )
}
