import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  PORTFOLIO_SCROLL_HANDOFF_EVENT,
  PORTFOLIO_SCROLL_REENGAGE_EVENT,
} from '../../intro/lib/createIntroScrollHandoff'
import {
  cancelScheduledScrollTriggerRefresh,
  scheduleScrollTriggerRefresh,
} from '../../../shared/scene/portfolioScene'
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
  /** Career + track endpoint nodes, in document order. */
  nodes: HTMLElement[]
  cards: HTMLElement[]
  years: readonly string[]
  /** Sticky intro (header + year). Pinned on desktop only. */
  intro?: HTMLElement | null
}

export type ExperienceTimelineController = {
  dispose: () => void
}

/** Apply a fully readable Experience presentation (no scroll animation). */
export function applyExperienceStaticPresentation(
  elements: Pick<
    ExperienceTimelineElements,
    'section' | 'progress' | 'year' | 'nodes' | 'cards' | 'years'
  >,
  motion: 'static' | 'unready' | 'error' = 'static',
): void {
  const { section, progress, year, nodes, cards, years } = elements
  gsap.set(progress, { scaleY: 1, transformOrigin: 'top center' })
  nodes.forEach((node) => node.classList.add('is-active'))
  cards.forEach((card) => card.classList.add('is-active'))
  if (years[0]) year.textContent = years[0]!
  section.dataset.experienceMotion = motion
}

function clearExperienceActiveClasses(
  elements: Pick<ExperienceTimelineElements, 'nodes' | 'cards' | 'progress'>,
): void {
  const { nodes, cards, progress } = elements
  nodes.forEach((node) => {
    node.classList.remove('is-active')
    node.style.willChange = ''
  })
  cards.forEach((card) => {
    card.classList.remove('is-active')
    card.style.willChange = ''
  })
  progress.style.willChange = ''
}

/**
 * Scrubs the cyan progress line and toggles milestone/card states.
 * Activation follows the *animated* progress (tween), not raw scroll progress,
 * so nodes light when the visible line reaches them under scrub lag.
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
  const careerCount = cards.length
  const desktopQuery = `(min-width: ${EXPERIENCE_TIMELINE.mobileMaxWidthPx + 1}px)`

  if (mode === 'static') {
    applyExperienceStaticPresentation(elements, 'static')
    return {
      dispose: () => {
        disposed = true
        clearExperienceActiveClasses(elements)
        delete section.dataset.experienceMotion
      },
    }
  }

  section.dataset.experienceMotion = 'scroll'

  const measureThresholds = () => {
    // Nodes are position:absolute inside each item — measure vs track box.
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

  const syncActive = (animatedProgress: number) => {
    const active = activeMilestoneIndex(animatedProgress, thresholds)
    nodes.forEach((node, index) => {
      node.classList.toggle('is-active', index <= active)
    })
    cards.forEach((card, index) => {
      card.classList.toggle('is-active', index <= active)
    })

    if (active !== lastActive) {
      lastActive = active
      const yearIndex =
        active < 0
          ? 0
          : Math.min(active, Math.max(years.length - 1, 0), careerCount - 1)
      const nextYear = years[Math.max(yearIndex, 0)]
      if (nextYear) year.textContent = nextYear
    }
  }

  const ctx = gsap.context(() => {
    gsap.set(progress, { scaleY: 0, transformOrigin: 'top center' })
    measureThresholds()
    syncActive(0)

    // Milestone sync lives on the tween onUpdate so numeric scrub lag stays
    // aligned with the visible progress line after scroll stops.
    gsap.fromTo(
      progress,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        onUpdate() {
          syncActive(this.progress())
        },
        scrollTrigger: {
          trigger: track,
          start: EXPERIENCE_TIMELINE.progressStart,
          end: EXPERIENCE_TIMELINE.progressEnd,
          scrub: EXPERIENCE_TIMELINE.scrub,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measureThresholds()
            // ease:none → rendered scaleY matches tween progress.
            const rendered = Number(gsap.getProperty(progress, 'scaleY')) || 0
            syncActive(rendered)
          },
        },
      },
    )

    // Desktop-only sidebar pin — matchMedia creates/destroys on breakpoint cross.
    const mm = gsap.matchMedia()
    mm.add(desktopQuery, () => {
      if (!intro) return
      const introParent = intro.parentElement
      if (!(introParent instanceof HTMLElement)) return

      const pinTop = EXPERIENCE_TIMELINE.introPinTopPx
      ScrollTrigger.create({
        trigger: intro,
        start: () => `top top+=${pinTop}`,
        endTrigger: introParent,
        end: () => `bottom top+=${pinTop + intro.offsetHeight}`,
        pin: intro,
        pinSpacing: false,
        invalidateOnRefresh: true,
      })
    })
  }, section)

  const requestRefresh = () => {
    if (disposed) return
    scheduleScrollTriggerRefresh(
      refreshState,
      () => !disposed,
      () => {
        measureThresholds()
      },
    )
  }

  window.addEventListener('resize', requestRefresh)
  window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, requestRefresh)
  window.addEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, requestRefresh)
  requestRefresh()

  return {
    dispose: () => {
      if (disposed) return
      disposed = true
      cancelScheduledScrollTriggerRefresh(refreshState)
      window.removeEventListener('resize', requestRefresh)
      window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, requestRefresh)
      window.removeEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, requestRefresh)
      clearExperienceActiveClasses(elements)
      ctx.revert()
      delete section.dataset.experienceMotion
      ScrollTrigger.refresh()
    },
  }
}
