import { useEffect, useState, type RefObject } from 'react'
import { useNearViewport } from '../../skills/hooks/useNearViewport'

/**
 * Decide when to fetch the book chunk — before Projects owns the wipe.
 * Mounting the Canvas stays gated separately on nav ownership.
 *
 * Triggers (OR):
 * 1. Section approaches viewport (Skills → Projects).
 * 2. User hovers / focuses a Projects nav link.
 *
 * Idle timeout removed — it raced the intersection trigger without measured benefit.
 */
export function useProjectBookPreloadTrigger(
  sectionRef: RefObject<Element | null>,
  enabled: boolean,
): boolean {
  const nearSection = useNearViewport(sectionRef, {
    rootMargin: '40% 0px',
    threshold: 0.01,
    latch: true,
    enabled,
  })

  const [navIntent, setNavIntent] = useState(false)

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

  return Boolean(enabled && (nearSection || navIntent))
}
