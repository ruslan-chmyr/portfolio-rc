import { useEffect, useState, type RefObject } from 'react'
import { useNearViewport } from '../../skills/hooks/useNearViewport'

/**
 * Decide when to fetch the book chunk — before Projects owns the wipe.
 * Mounting the Canvas stays gated separately on nav ownership.
 */
export function useProjectBookPreloadTrigger(
  sectionRef: RefObject<Element | null>,
  enabled: boolean,
): boolean {
  const nearSection = useNearViewport(sectionRef, {
    // Projects overlaps Skills; this fires while still in Skills → early import.
    rootMargin: '40% 0px',
    threshold: 0.01,
    latch: true,
    enabled,
  })

  const [navIntent, setNavIntent] = useState(false)
  const [idleIntent, setIdleIntent] = useState(false)

  useEffect(() => {
    if (!enabled || navIntent) return
    const kick = () => setNavIntent(true)
    const links = document.querySelectorAll(
      'a[href="#projects"], [data-nav-section="projects"]',
    )
    for (const node of links) {
      node.addEventListener('pointerenter', kick)
      node.addEventListener('focus', kick)
    }
    return () => {
      for (const node of links) {
        node.removeEventListener('pointerenter', kick)
        node.removeEventListener('focus', kick)
      }
    }
  }, [enabled, navIntent])

  useEffect(() => {
    if (!enabled || idleIntent || nearSection || navIntent) return
    const ric = window.requestIdleCallback
    if (typeof ric === 'function') {
      const id = ric(() => setIdleIntent(true), { timeout: 4000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const t = window.setTimeout(() => setIdleIntent(true), 2500)
    return () => window.clearTimeout(t)
  }, [enabled, idleIntent, nearSection, navIntent])

  return Boolean(enabled && (nearSection || navIntent || idleIntent))
}
