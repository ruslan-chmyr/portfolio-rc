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

gsap.registerPlugin(ScrollTrigger)

export type ContactEntranceElements = {
  section: HTMLElement
  intro: HTMLElement
  links: HTMLElement
  form: HTMLElement
  footer: HTMLElement
}

export type ContactEntranceController = {
  dispose: () => void
}

export function createContactEntranceController(
  elements: ContactEntranceElements,
  options: { prefersReducedMotion: boolean },
): ContactEntranceController {
  const { section, intro, links, form, footer } = elements
  let disposed = false
  const refreshState = { raf: 0, pending: false }

  if (options.prefersReducedMotion) {
    section.dataset.contactMotion = 'static'
    return {
      dispose: () => {
        disposed = true
        delete section.dataset.contactMotion
      },
    }
  }

  section.dataset.contactMotion = 'scroll'
  const targets = [intro, links, form, footer]

  const ctx = gsap.context(() => {
    gsap.set(targets, { autoAlpha: 0, y: 22 })

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: section,
        // Slightly earlier so copy begins as Experience yields the frame.
        start: 'top 82%',
        once: true,
        invalidateOnRefresh: true,
      },
    })

    tl.to(intro, { autoAlpha: 1, y: 0, duration: 0.68 }, 0)
      .to(links, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.1)
      .to(form, { autoAlpha: 1, y: 0, duration: 0.62 }, 0.18)
      .to(footer, { autoAlpha: 1, y: 0, duration: 0.48 }, 0.28)
  }, section)

  const requestRefresh = () => {
    if (disposed) return
    scheduleScrollTriggerRefresh(refreshState, () => !disposed)
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
      gsap.set(targets, { clearProps: 'opacity,visibility,transform' })
      ctx.revert()
      delete section.dataset.contactMotion
      ScrollTrigger.refresh()
    },
  }
}
