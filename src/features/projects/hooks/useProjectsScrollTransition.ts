import { useLayoutEffect, type RefObject } from 'react'
import { applyProjectsStaticLayout } from '../lib/applyProjectsStaticLayout'
import {
  createProjectsScrollController,
  type ProjectsScrollController,
} from '../lib/createProjectsScrollController'
import {
  PROJECTS_SCROLL,
  selectProjectsPresentationMode,
} from '../lib/projectsScrollConfig'

export type ProjectsScrollTargets = {
  sectionRef: RefObject<HTMLElement | null>
  pinRef: RefObject<HTMLElement | null>
  panelRef: RefObject<HTMLElement | null>
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useProjectsScrollTransition(targets: ProjectsScrollTargets) {
  useLayoutEffect(() => {
    const section = targets.sectionRef.current
    const pin = targets.pinRef.current
    const panel = targets.panelRef.current
    if (!section || !pin || !panel) return

    let controller: ProjectsScrollController | undefined
    let clearStatic: (() => void) | undefined

    const mobileMq = window.matchMedia(
      `(max-width: ${PROJECTS_SCROLL.mobileMaxWidthPx}px)`,
    )
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const setup = () => {
      controller?.dispose()
      controller = undefined
      clearStatic?.()
      clearStatic = undefined

      const mode = selectProjectsPresentationMode({
        isMobile: mobileMq.matches,
        prefersReducedMotion: prefersReducedMotion() || motionMq.matches,
      })

      if (mode === 'static') {
        clearStatic = applyProjectsStaticLayout(section, panel)
        return
      }

      controller = createProjectsScrollController({ section, pin, panel })
    }

    setup()
    mobileMq.addEventListener('change', setup)
    motionMq.addEventListener('change', setup)

    return () => {
      mobileMq.removeEventListener('change', setup)
      motionMq.removeEventListener('change', setup)
      controller?.dispose()
      clearStatic?.()
    }
  }, [targets])
}
