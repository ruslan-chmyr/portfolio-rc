import { useLayoutEffect, type RefObject } from 'react'
import { applyAboutReducedMotion } from '../lib/applyAboutReducedMotion'
import { createAboutScrollController } from '../lib/createAboutScrollController'

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

    if (prefersReducedMotion()) {
      applyAboutReducedMotion(section, typeWords, content)
      return
    }

    const controller = createAboutScrollController({
      section,
      pin,
      stage,
      senior,
      frontend,
      engineer,
      content,
    })

    return () => controller.dispose()
  }, [enabled, targets])
}
