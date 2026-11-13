import { useEffect, useRef, useState } from 'react'

/** Pure helper — one step toward the target page. */
export function stepTowardPage(current: number, target: number): number {
  if (current === target) return current
  return target > current ? current + 1 : current - 1
}

export function delayForPageGap(gap: number): number {
  return gap > 2 ? 50 : 150
}

/** True once the visual book has finished stepping to the authoritative target. */
export function isBookPageSettled(
  targetPage: number,
  delayedPage: number,
): boolean {
  return targetPage === delayedPage
}

/**
 * Step page index one sheet at a time (reference delayedPage pattern)
 * so stacked SkinnedMesh turns stay sequential and readable.
 *
 * Timers are scheduled only in effects — never inside React state updaters.
 */
export function useDelayedBookPage(
  page: number,
  reducedMotion: boolean,
): number {
  const [delayedPage, setDelayedPage] = useState(page)
  const delayedRef = useRef(page)
  const targetRef = useRef(page)

  useEffect(() => {
    targetRef.current = page
  }, [page])

  useEffect(() => {
    if (reducedMotion) {
      delayedRef.current = page
      const id = window.setTimeout(() => setDelayedPage(page), 0)
      return () => window.clearTimeout(id)
    }

    let cancelled = false
    let timer = 0

    const run = () => {
      if (cancelled) return
      const current = delayedRef.current
      const target = targetRef.current
      if (current === target) return

      const next = stepTowardPage(current, target)
      delayedRef.current = next
      setDelayedPage(next)

      if (next !== targetRef.current) {
        const gap = Math.abs(targetRef.current - next)
        timer = window.setTimeout(run, delayForPageGap(gap))
      }
    }

    timer = window.setTimeout(run, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [page, reducedMotion])

  return delayedPage
}
