import { useEffect, useState, type RefObject } from 'react'

export type UseNearViewportOptions = {
  rootMargin?: string
  threshold?: number | number[]
  /**
   * When true (default), the first “near” observation sticks for the lifetime
   * of the hook — used to start a one-shot dynamic import.
   */
  latch?: boolean
  /** When false, skip observing and report not near. */
  enabled?: boolean
}

/**
 * Reports whether `targetRef` is near (or inside) the viewport.
 * Without IntersectionObserver, falls back to `true` so features stay usable.
 */
export function useNearViewport(
  targetRef: RefObject<Element | null>,
  options: UseNearViewportOptions = {},
): boolean {
  const {
    rootMargin = '0px',
    threshold = 0,
    latch = true,
    enabled = true,
  } = options

  const [near, setNear] = useState(() => {
    if (!enabled) return false
    if (typeof IntersectionObserver === 'undefined') return true
    return false
  })

  useEffect(() => {
    if (!enabled) {
      setNear(false)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }

    let cancelled = false
    let observer: IntersectionObserver | undefined
    let retryRaf = 0

    const attach = (node: Element) => {
      let latched = false
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) {
            if (!latch) setNear(false)
            return
          }
          if (latch) {
            if (latched) return
            latched = true
            observer?.disconnect()
          }
          setNear(true)
        },
        { root: null, rootMargin, threshold },
      )
      observer.observe(node)
    }

    const node = targetRef.current
    if (node) {
      attach(node)
    } else {
      // Ref may not be set on the first effect tick; retry once after layout.
      retryRaf = window.requestAnimationFrame(() => {
        retryRaf = 0
        if (cancelled) return
        const late = targetRef.current
        if (late) attach(late)
      })
    }

    return () => {
      cancelled = true
      if (retryRaf) window.cancelAnimationFrame(retryRaf)
      observer?.disconnect()
    }
  }, [targetRef, rootMargin, threshold, latch, enabled])

  return near
}
