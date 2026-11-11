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
  /** Career + CV endpoint nodes, in document order. */
  nodes: HTMLElement[]
  cards: HTMLElement[]
  years: readonly string[]
  /** Sticky intro (header + year + CTA). Pinned on desktop only. */
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
  const cta = section.querySelector<HTMLElement>('[data-experience-cta]')
  if (cta) {
    cta.classList.add('is-active')
    cta.removeAttribute('inert')
  }
  if (years[0]) year.textContent = years[0]!
  section.dataset.experienceMotion = motion
}

function clearExperienceActiveClasses(
  elements: Pick<ExperienceTimelineElements, 'nodes' | 'cards' | 'section' | 'progress'>,
): void {
  const { nodes, cards, section, progress } = elements
  nodes.forEach((node) => {
    node.classList.remove('is-active')
    node.style.willChange = ''
  })
  cards.forEach((card) => {
    card.classList.remove('is-active')
    card.style.willChange = ''
  })
  const cta = section.querySelector<HTMLElement>('[data-experience-cta]')
  cta?.classList.remove('is-active')
  cta?.setAttribute('inert', '')
  progress.style.willChange = ''
}

/**
 * Scrubs the cyan progress line and toggles milestone/card/CTA states.
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

  const cta = section.querySelector<HTMLElement>('[data-experience-cta]')

  const setCtaActive = (active: boolean) => {
    if (!cta) return
    cta.classList.toggle('is-active', active)
    if (active) cta.removeAttribute('inert')
    else cta.setAttribute('inert', '')
    // Geometry is reserved in CSS — no ScrollTrigger refresh on reveal.
  }

  const syncActive = (animatedProgress: number) => {
    const active = activeMilestoneIndex(animatedProgress, thresholds)
    nodes.forEach((node, index) => {
      node.classList.toggle('is-active', index <= active)
    })
    cards.forEach((card, index) => {
      card.classList.toggle('is-active', index <= active)
    })
    // CV endpoint is the last measured node — after the final career milestone.
    setCtaActive(active >= nodes.length - 1 && active >= 0)

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

  // Start inert until the endpoint illuminates.
  setCtaActive(false)

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
          onUpdate: (self) => {
            // Prefer the tween's scrubbed progress (matches rendered scaleY),
            // not raw ScrollTrigger progress which leads the visible line.
            const animated = self.animation?.progress()
            syncActive(
              typeof animated === 'number' ? animated : self.progress,
            )
          },
          onRefresh: (self) => {
            measureThresholds()
            const animated = self.animation?.progress()
            if (typeof animated === 'number') syncActive(animated)
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
