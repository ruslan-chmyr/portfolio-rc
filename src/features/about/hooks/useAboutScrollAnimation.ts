import { useLayoutEffect, type RefObject } from 'react'
import { applyAboutMobileLayout } from '../lib/applyAboutMobileLayout'
import { applyAboutReducedMotion } from '../lib/applyAboutReducedMotion'
import {
  createAboutScrollController,
  type AboutScrollController,
} from '../lib/createAboutScrollController'
import {
  ABOUT_MOBILE_MAX_WIDTH_PX,
  selectAboutPresentationMode,
} from '../lib/selectAboutPresentationMode'

export type AboutScrollTargets = {
  sectionRef: RefObject<HTMLElement | null>
  pinRef: RefObject<HTMLElement | null>
  typeStageRef: RefObject<HTMLDivElement | null>
  seniorRef: RefObject<HTMLElement | null>
  frontendRef: RefObject<HTMLElement | null>
  engineerRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useAboutScrollAnimation(targets: AboutScrollTargets, enabled: boolean) {
  useLayoutEffect(() => {
    const section = targets.sectionRef.current
    const pin = targets.pinRef.current
    const stage = targets.typeStageRef.current
    const senior = targets.seniorRef.current
    const frontend = targets.frontendRef.current
    const engineer = targets.engineerRef.current
    const content = targets.contentRef.current

    if (
      !enabled ||
      !section ||
      !pin ||
      !stage ||
      !senior ||
      !frontend ||
      !engineer ||
      !content
    ) {
      return
    }

    const typeWords = [senior, frontend, engineer]
    let controller: AboutScrollController | undefined
    const mobileMq = window.matchMedia(`(max-width: ${ABOUT_MOBILE_MAX_WIDTH_PX}px)`)
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const clearModeClasses = () => {
      section.classList.remove(
        'about-section--mobile',
        'about-section--static',
        'about-section--type-ready',
        'about-section--motion-reduced',
      )
    }

    const setup = () => {
      controller?.dispose()
      controller = undefined
      clearModeClasses()

      const reduced = prefersReducedMotion() || motionMq.matches
      const mode = selectAboutPresentationMode({
        isMobile: mobileMq.matches,
        prefersReducedMotion: reduced,
      })

      if (mode === 'mobile') {
        applyAboutMobileLayout(section, typeWords, content, {
          prefersReducedMotion: reduced,
        })
        return
      }

      if (mode === 'reduced-motion') {
        applyAboutReducedMotion(section, typeWords, content)
        return
      }

      controller = createAboutScrollController({
        section,
        pin,
        stage,
        senior,
        frontend,
        engineer,
        content,
      })
    }

    setup()
    mobileMq.addEventListener('change', setup)
    motionMq.addEventListener('change', setup)

    return () => {
      mobileMq.removeEventListener('change', setup)
      motionMq.removeEventListener('change', setup)
      controller?.dispose()
      clearModeClasses()
    }
  }, [enabled, targets])
}
