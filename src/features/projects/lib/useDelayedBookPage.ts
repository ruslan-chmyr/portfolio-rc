import { useEffect, useState } from 'react'

/**
 * Step page index one sheet at a time (reference delayedPage pattern)
 * so stacked SkinnedMesh turns stay sequential and readable.
 */
export function useDelayedBookPage(page: number, reducedMotion: boolean): number {
  const [delayedPage, setDelayedPage] = useState(page)

  useEffect(() => {
    if (reducedMotion) {
      const id = window.setTimeout(() => setDelayedPage(page), 0)
      return () => window.clearTimeout(id)
    }

    let timeout: number | undefined
    const step = () => {
      setDelayedPage((current) => {
        if (current === page) return current
        const gap = Math.abs(page - current)
        timeout = window.setTimeout(step, gap > 2 ? 50 : 150)
        if (page > current) return current + 1
        if (page < current) return current - 1
        return current
      })
    }
    const kick = window.setTimeout(step, 0)
    return () => {
      window.clearTimeout(kick)
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
  }, [page, reducedMotion])

  return delayedPage
}

/** Pure helper for tests — one step toward the target page. */
export function stepTowardPage(current: number, target: number): number {
  if (current === target) return current
  return target > current ? current + 1 : current - 1
}
