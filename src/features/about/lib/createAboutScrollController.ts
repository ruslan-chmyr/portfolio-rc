import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PORTFOLIO_SCROLL_HANDOFF_EVENT } from '../../intro/lib/createIntroScrollHandoff'
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

  const relayoutCluster = () => {
    const progress = scrollTimeline?.progress() ?? 0
    syncTypeClusterLayout(stage, typeWords)
    scrollTimeline?.progress(progress)
  }

  section.classList.remove('about-section--type-ready', 'about-section--static')

  const ctx = gsap.context(() => {
    syncTypeClusterLayout(stage, typeWords)
    setAboutScrollInitialStates(timelineTargets, indexEl, ambientReveal)

    scrollTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: ABOUT_SCROLL.triggerStart,
        end: `+=${endDistance}`,
        pin,
        scrub: ABOUT_SCROLL.scrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    })

    buildAboutScrollTimeline(scrollTimeline, timelineTargets)

    const progress = scrollTimeline.scrollTrigger?.progress ?? 0
    scrollTimeline.progress(progress)
    section.classList.add('about-section--type-ready')
  }, section)

  const onHandoff = () => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh(true)
      scrollTimeline?.scrollTrigger?.update()
    })
  }
  window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, onHandoff)

  const onResize = () => {
    relayoutCluster()
    ScrollTrigger.refresh()
  }
  window.addEventListener('resize', onResize)

  const dispose = () => {
    window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, onHandoff)
    window.removeEventListener('resize', onResize)
    ctx.revert()
    section.classList.remove('about-section--static', 'about-section--type-ready')
  }

  return { dispose }
}
