import { useEffect, useState } from 'react'
import { isProjectsNavOwned } from '../../../shared/scene/portfolioScene'

/**
 * True once the blue Projects panel wipe owns chrome/nav —
 * safe moment to mount interactive book content without fighting Skills.
 */
export function useProjectsNavOwned(): boolean {
  const [owned, setOwned] = useState(() =>
    typeof document === 'undefined' ? false : isProjectsNavOwned(),
  )

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setOwned(isProjectsNavOwned())
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-projects-nav'],
    })
    return () => observer.disconnect()
  }, [])

  return owned
}
