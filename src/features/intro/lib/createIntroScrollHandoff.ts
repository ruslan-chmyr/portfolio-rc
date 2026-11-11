/** Classes toggled on `documentElement` / intro root when native portfolio scroll takes over. */
const ROOT_CLASS = 'portfolio-native-scroll'
const INTRO_HANDED_OFF_CLASS = 'intro-animation--handed-off'
export const PORTFOLIO_SCROLL_HANDOFF_EVENT = 'portfolio-scroll-handoff'
/** Fired when intro re-captures scroll at the top (about cluster must re-measure). */
export const PORTFOLIO_SCROLL_REENGAGE_EVENT = 'portfolio-scroll-reengage'

export type IntroScrollHandoff = {
  isCapturing: () => boolean
  releaseForward: () => void
  reengage: () => void
  dispose: () => void
}

export function createIntroScrollHandoff(root: HTMLElement): IntroScrollHandoff {
  let capturing = true

  const applyDomState = () => {
    document.documentElement.classList.toggle(ROOT_CLASS, !capturing)
    root.classList.toggle(INTRO_HANDED_OFF_CLASS, !capturing)
    if (capturing) {
      window.scrollTo(0, 0)
    }
  }

  return {
    isCapturing: () => capturing,
    releaseForward() {
      if (!capturing) return
      capturing = false
      applyDomState()
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0)
        window.dispatchEvent(new CustomEvent(PORTFOLIO_SCROLL_HANDOFF_EVENT))
      }
    },
    reengage() {
      if (capturing) return
      capturing = true
      applyDomState()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PORTFOLIO_SCROLL_REENGAGE_EVENT))
      }
    },
    dispose() {
      capturing = true
      document.documentElement.classList.remove(ROOT_CLASS)
      root.classList.remove(INTRO_HANDED_OFF_CLASS)
    },
  }
}
