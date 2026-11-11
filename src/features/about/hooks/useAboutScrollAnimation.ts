import { useLayoutEffect, type RefObject } from 'react'
import { applyAboutMobileLayout, isAboutMobileViewport } from '../lib/applyAboutMobileLayout'
import { applyAboutReducedMotion } from '../lib/applyAboutReducedMotion'
import {
  createAboutScrollController,
  type AboutScrollController,
} from '../lib/createAboutScrollController'

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
    const mobileMq = window.matchMedia('(max-width: 700px)')

    const clearModeClasses = () => {
      section.classList.remove(
        'about-section--mobile',
        'about-section--static',
        'about-section--type-ready',
      )
    }

    const setup = () => {
      controller?.dispose()
      controller = undefined
      clearModeClasses()

      if (prefersReducedMotion()) {
        applyAboutReducedMotion(section, typeWords, content)
        return
      }

      if (isAboutMobileViewport() || mobileMq.matches) {
        applyAboutMobileLayout(section, typeWords, content)
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

    return () => {
      mobileMq.removeEventListener('change', setup)
      controller?.dispose()
      clearModeClasses()
    }
  }, [enabled, targets])
}
