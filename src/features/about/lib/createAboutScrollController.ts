import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  PORTFOLIO_SCROLL_HANDOFF_EVENT,
  PORTFOLIO_SCROLL_REENGAGE_EVENT,
} from '../../intro/lib/createIntroScrollHandoff'
import {
  buildAboutScrollTimeline,
  setAboutScrollInitialStates,
  type AboutScrollTimelineTargets,
} from './buildAboutScrollTimeline'
import { ABOUT_SCROLL } from './aboutScrollConfig'
import { syncTypeClusterLayout } from './syncTypeClusterLayout'

gsap.registerPlugin(ScrollTrigger)

export type AboutScrollControllerElements = {
  section: HTMLElement
  pin: HTMLElement
  stage: HTMLDivElement
  senior: HTMLElement
  frontend: HTMLElement
  engineer: HTMLElement
  content: HTMLElement
}

export type AboutScrollController = {
  dispose: () => void
}

export function createAboutScrollController(
  elements: AboutScrollControllerElements,
): AboutScrollController {
  const { section, pin, stage, senior, frontend, engineer, content } = elements
  const typeWords = [senior, frontend, engineer]

  const indexEl = section.querySelector<HTMLElement>('.about-section__index-column')
  const ambientReveal = section.querySelector<HTMLElement>('.about-tech-ambient__reveal')
  const revealEls = section.querySelectorAll<HTMLElement>('.about-content__reveal')

  const timelineTargets: AboutScrollTimelineTargets = {
    stage,
    senior,
    frontend,
    engineer,
    content,
    typeWords,
    revealEls,
    indexEl,
    ambientReveal,
  }

  const endDistance = Math.max(
    ABOUT_SCROLL.minPinPx,
    window.innerHeight * ABOUT_SCROLL.pinViewportFactor,
  )

  let scrollTimeline: gsap.core.Timeline | undefined

  /**
   * Re-measure the centered cluster, then re-seed timeline start values.
   * Avoids invalidateOnRefresh silently capturing x/y:0 after a deep scrub.
   */
  const relayoutCluster = () => {
    const progress = scrollTimeline?.progress() ?? 0
    if (!scrollTimeline) {
      syncTypeClusterLayout(stage, typeWords)
      return
    }

    scrollTimeline.invalidate()
    setAboutScrollInitialStates(timelineTargets, indexEl, ambientReveal)
    // Word x/y after this sync become the scrub "from" values (cluster → corners).
    syncTypeClusterLayout(stage, typeWords)
    scrollTimeline.progress(0, true)
    scrollTimeline.progress(progress, true)
  }

  const scheduleRelayout = () => {
    requestAnimationFrame(() => {
      relayoutCluster()
      ScrollTrigger.refresh()
      scrollTimeline?.scrollTrigger?.update()
    })
  }

  section.classList.remove('about-section--type-ready', 'about-section--static')

  const ctx = gsap.context(() => {
    syncTypeClusterLayout(stage, typeWords)
    setAboutScrollInitialStates(timelineTargets, indexEl, ambientReveal)
    // Cluster again after stage entrance set — measure used identity stage inside sync.
    syncTypeClusterLayout(stage, typeWords)

    scrollTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: ABOUT_SCROLL.triggerStart,
        end: `+=${endDistance}`,
        pin,
        scrub: ABOUT_SCROLL.scrub,
        anticipatePin: 1,
        // Manual relayoutCluster owns start-value refresh (see comment on relayoutCluster).
        invalidateOnRefresh: false,
      },
    })

    buildAboutScrollTimeline(scrollTimeline, timelineTargets)

    const progress = scrollTimeline.scrollTrigger?.progress ?? 0
    scrollTimeline.progress(progress)
    section.classList.add('about-section--type-ready')
  }, section)

  const onHandoff = () => scheduleRelayout()
  const onReengage = () => scheduleRelayout()
  window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, onHandoff)
  window.addEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, onReengage)

  const onResize = () => {
    relayoutCluster()
    ScrollTrigger.refresh()
  }
  window.addEventListener('resize', onResize)

  const fontsReady =
    typeof document !== 'undefined' && document.fonts?.ready
      ? document.fonts.ready.then(() => {
          if (!scrollTimeline) return
          relayoutCluster()
          ScrollTrigger.refresh()
        })
      : null

  const dispose = () => {
    window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, onHandoff)
    window.removeEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, onReengage)
    window.removeEventListener('resize', onResize)
    void fontsReady
    ctx.revert()
    section.classList.remove('about-section--static', 'about-section--type-ready')
  }

  return { dispose }
}
