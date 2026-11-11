import { useLayoutEffect, type RefObject } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  applyExperienceStaticPresentation,
  createExperienceTimelineController,
  type ExperienceTimelineController,
} from '../lib/createExperienceTimelineController'
import type { ExperienceEntry } from '../model/experienceConfig'

export type ExperienceTimelineTargets = {
  trackRef: RefObject<HTMLElement | null>
  progressRef: RefObject<HTMLElement | null>
  yearRef: RefObject<HTMLElement | null>
  entries: readonly ExperienceEntry[]
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function collectTimelineNodes(track: HTMLElement): {
  careerNodes: HTMLElement[]
  nodes: HTMLElement[]
} {
  const careerNodes = Array.from(
    track.querySelectorAll<HTMLElement>(
      '[data-experience-node]:not([data-experience-endpoint-node])',
    ),
  )
  const endpointNodes = Array.from(
    track.querySelectorAll<HTMLElement>('[data-experience-endpoint-node]'),
  )
  return { careerNodes, nodes: [...careerNodes, ...endpointNodes] }
}

/**
 * Mount the Experience scroll timeline. Fail-open: missing nodes or init
 * errors leave a fully readable static section.
 */
export function useExperienceTimeline(targets: ExperienceTimelineTargets) {
  const { trackRef, progressRef, yearRef, entries } = targets

  useLayoutEffect(() => {
    const track = trackRef.current
    const progress = progressRef.current
    const year = yearRef.current
    if (!track || !progress || !year) return

    const section = track.closest('section')
    if (!(section instanceof HTMLElement)) return

    let controller: ExperienceTimelineController | undefined
    let cancelled = false
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const years = entries.map((entry) => entry.year)

    const failOpen = (motion: 'unready' | 'error') => {
      const cards = Array.from(
        section.querySelectorAll<HTMLElement>('[data-experience-card]'),
      )
      const { nodes } = collectTimelineNodes(track)
      applyExperienceStaticPresentation(
        { section, progress, year, nodes, cards, years },
        motion,
      )
    }

    const setup = () => {
      controller?.dispose()
      controller = undefined
      if (cancelled) return

      const cards = Array.from(
        section.querySelectorAll<HTMLElement>('[data-experience-card]'),
      )
      const { careerNodes, nodes } = collectTimelineNodes(track)
      const intro = section.querySelector<HTMLElement>(
        '.experience-timeline__sidebar-sticky',
      )

      if (careerNodes.length === 0 || cards.length !== careerNodes.length) {
        failOpen('unready')
        return
      }

      try {
        controller = createExperienceTimelineController(
          {
            section,
            track,
            progress,
            year,
            nodes,
            cards,
            years,
            intro,
          },
          {
            prefersReducedMotion: prefersReducedMotion() || motionMq.matches,
          },
        )
        delete section.dataset.experienceError
      } catch {
        // Fail-open: keep content readable. Avoid leaking exception text to DOM.
        failOpen('error')
        section.dataset.experienceError = 'timeline-init-failed'
      }
    }

    setup()
    motionMq.addEventListener('change', setup)

    void document.fonts?.ready.then(() => {
      if (cancelled) return
      ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      motionMq.removeEventListener('change', setup)
      controller?.dispose()
    }
  }, [trackRef, progressRef, yearRef, entries])
}
