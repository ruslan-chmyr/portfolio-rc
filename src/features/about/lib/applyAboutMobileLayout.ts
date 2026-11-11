import { applyAboutReducedMotion } from './applyAboutReducedMotion'

/** Static stacked layout for narrow viewports — no pin/scrub type choreography. */
export function applyAboutMobileLayout(
  section: HTMLElement,
  typeWords: HTMLElement[],
  content: HTMLElement,
) {
  applyAboutReducedMotion(section, typeWords, content)
  section.classList.add('about-section--mobile')
}

export function isAboutMobileViewport(width = typeof window !== 'undefined' ? window.innerWidth : 0) {
  return width > 0 && width <= 700
}
