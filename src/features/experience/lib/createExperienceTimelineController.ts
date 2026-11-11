import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  PORTFOLIO_SCROLL_HANDOFF_EVENT,
  PORTFOLIO_SCROLL_REENGAGE_EVENT,
} from '../../intro/lib/createIntroScrollHandoff'
import { scheduleScrollTriggerRefresh } from '../../../shared/scene/portfolioScene'
import {
  EXPERIENCE_TIMELINE,
  activeMilestoneIndex,
  milestoneProgressThreshold,
  selectExperienceMotionMode,
} from './experienceTimelineConfig'

gsap.registerPlugin(ScrollTrigger)

export type ExperienceTimelineElements = {
  section: HTMLElement
  track: HTMLElement
  progress: HTMLElement
  year: HTMLElement
  nodes: HTMLElement[]
  cards: HTMLElement[]
  years: readonly string[]
  /** Sticky intro (header + year). Pinned for the timeline scroll on desktop. */
  intro?: HTMLElement | null
}

export type ExperienceTimelineController = {
  dispose: () => void
}

/**
 * Scrubs the cyan progress line and toggles milestone/card active states.
 * Natural document flow only — no extra pin (Projects owns the prior pin).
 */
export function createExperienceTimelineController(
  elements: ExperienceTimelineElements,
  options: { prefersReducedMotion: boolean },
): ExperienceTimelineController {
  const { section, track, progress, year, nodes, cards, years, intro } = elements
  const mode = selectExperienceMotionMode({
    prefersReducedMotion: options.prefersReducedMotion,
  })

  let disposed = false
  const thresholds: number[] = []
  let lastActive = -2
  const refreshState = { raf: 0, pending: false }
  const isMobile = () =>
    window.matchMedia(
      `(max-width: ${EXPERIENCE_TIMELINE.mobileMaxWidthPx}px)`,
    ).matches

  const applyStatic = () => {
    gsap.set(progress, { scaleY: 1, transformOrigin: 'top center' })
    nodes.forEach((node) => node.classList.add('is-active'))
    cards.forEach((card) => card.classList.add('is-active'))
    section
      .querySelector<HTMLElement>('[data-experience-cta]')
      ?.classList.add('is-active')
    if (years[0]) year.textContent = years[0]!
    section.dataset.experienceMotion = 'static'
  }

  if (mode === 'static') {
    applyStatic()
    return {
      dispose: () => {
        disposed = true
        nodes.forEach((node) => node.classList.remove('is-active'))
        cards.forEach((card) => card.classList.remove('is-active'))
        delete section.dataset.experienceMotion
      },
    }
  }

  section.dataset.experienceMotion = 'scroll'

  const measureThresholds = () => {
    // Nodes are position:absolute inside each item — offsetTop is local to the
    // item, not the track. Measure against the track's bounding box instead.
    const trackRect = track.getBoundingClientRect()
    const trackHeight = Math.max(track.offsetHeight, 1)
    thresholds.length = 0
    nodes.forEach((node) => {
      const nodeRect = node.getBoundingClientRect()
      const offset = nodeRect.top + nodeRect.height / 2 - trackRect.top
      thresholds.push(
        milestoneProgressThreshold({
          nodeOffsetPx: offset,
          trackHeightPx: trackHeight,
        }),
      )
    })
  }

  const cta = section.querySelector<HTMLElement>('[data-experience-cta]')

  const syncActive = (progressValue: number) => {
    const active = activeMilestoneIndex(progressValue, thresholds)
    nodes.forEach((node, index) => {
      node.classList.toggle('is-active', index <= active)
    })
    cards.forEach((card, index) => {
      card.classList.toggle('is-active', index <= active)
    })
    // Reveal CV invite once the final career milestone is reached.
    if (cta) {
      cta.classList.toggle('is-active', active >= nodes.length - 1 && active >= 0)
    }
    if (active !== lastActive) {
      lastActive = active
      const yearIndex =
        active < 0 ? 0 : Math.min(active, Math.max(years.length - 1, 0))
      const nextYear = years[yearIndex]
      if (nextYear) year.textContent = nextYear
    }
  }

  const ctx = gsap.context(() => {
    gsap.set(progress, { scaleY: 0, transformOrigin: 'top center' })
    measureThresholds()
    syncActive(0)

    gsap.fromTo(
      progress,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: track,
          start: EXPERIENCE_TIMELINE.progressStart,
          end: EXPERIENCE_TIMELINE.progressEnd,
          scrub: EXPERIENCE_TIMELINE.scrub,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measureThresholds()
          },
          onUpdate: (self) => {
            syncActive(self.progress)
          },
        },
      },
    )

    // Keep header + year in view for the full timeline column height.
    const introParent = intro?.parentElement
    if (intro && introParent instanceof HTMLElement && !isMobile()) {
      const pinTop = EXPERIENCE_TIMELINE.introPinTopPx
      ScrollTrigger.create({
        trigger: intro,
        start: () => `top top+=${pinTop}`,
        endTrigger: introParent,
        // Release when the column bottom reaches the pinned intro bottom
        // (true sticky behavior through the full timeline height).
        end: () => `bottom top+=${pinTop + intro.offsetHeight}`,
        pin: intro,
        pinSpacing: false,
        invalidateOnRefresh: true,
      })
    }
  }, section)

  const runRefresh = () => {
    if (disposed) return
    measureThresholds()
    ScrollTrigger.refresh()
  }

  const requestRefresh = () => {
    if (disposed) return
    scheduleScrollTriggerRefresh(runRefresh, refreshState)
  }

  window.addEventListener('resize', requestRefresh)
  window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, requestRefresh)
  window.addEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, requestRefresh)
  requestRefresh()

  return {
    dispose: () => {
      if (disposed) return
      disposed = true
      if (refreshState.raf) {
        window.cancelAnimationFrame(refreshState.raf)
        refreshState.raf = 0
        refreshState.pending = false
      }
      window.removeEventListener('resize', requestRefresh)
      window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, requestRefresh)
      window.removeEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, requestRefresh)
      nodes.forEach((node) => {
        node.classList.remove('is-active')
        node.style.willChange = ''
      })
      cards.forEach((card) => {
        card.classList.remove('is-active')
        card.style.willChange = ''
      })
      cta?.classList.remove('is-active')
      progress.style.willChange = ''
      ctx.revert()
      delete section.dataset.experienceMotion
      ScrollTrigger.refresh()
    },
  }
}
