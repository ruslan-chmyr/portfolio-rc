import { useLayoutEffect, type RefObject } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
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

    const setup = () => {
      controller?.dispose()
      controller = undefined
      if (cancelled) return

      const nodes = Array.from(
        track.querySelectorAll<HTMLElement>('[data-experience-node]'),
      )
      const cards = Array.from(
        section.querySelectorAll<HTMLElement>('[data-experience-card]'),
      )
      const intro = section.querySelector<HTMLElement>(
        '.experience-timeline__sidebar-sticky',
      )
      if (nodes.length === 0 || cards.length !== nodes.length) {
        section.dataset.experienceMotion = 'unready'
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
            years: entries.map((entry) => entry.year),
            intro,
          },
          {
            prefersReducedMotion: prefersReducedMotion() || motionMq.matches,
          },
        )
        delete section.dataset.experienceError
      } catch (error) {
        section.dataset.experienceMotion = 'error'
        section.dataset.experienceError =
          error instanceof Error ? error.message : 'timeline-init-failed'
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
