import { useLayoutEffect, type RefObject } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  createContactEntranceController,
  type ContactEntranceController,
} from '../lib/createContactEntranceController'

export type ContactEntranceTargets = {
  sectionRef: RefObject<HTMLElement | null>
  introRef: RefObject<HTMLElement | null>
  linksRef: RefObject<HTMLElement | null>
  formRef: RefObject<HTMLElement | null>
  footerRef: RefObject<HTMLElement | null>
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useContactEntrance(targets: ContactEntranceTargets) {
  const { sectionRef, introRef, linksRef, formRef, footerRef } = targets

  useLayoutEffect(() => {
    const section = sectionRef.current
    const intro = introRef.current
    const links = linksRef.current
    const form = formRef.current
    const footer = footerRef.current
    if (!section || !intro || !links || !form || !footer) return

    let controller: ContactEntranceController | undefined
    let cancelled = false
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const setup = () => {
      controller?.dispose()
      controller = undefined
      if (cancelled) return
      controller = createContactEntranceController(
        { section, intro, links, form, footer },
        { prefersReducedMotion: prefersReducedMotion() || motionMq.matches },
      )
    }

    setup()
    motionMq.addEventListener('change', setup)
    void document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      motionMq.removeEventListener('change', setup)
      controller?.dispose()
    }
  }, [sectionRef, introRef, linksRef, formRef, footerRef])
}
