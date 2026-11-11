import { clearAboutAnimationStyles } from './clearAboutAnimationStyles'

export {
  ABOUT_MOBILE_MAX_WIDTH_PX,
  isAboutMobileViewport,
} from './selectAboutPresentationMode'

type ApplyAboutMobileLayoutOptions = {
  prefersReducedMotion?: boolean
}

/**
 * Static-flow editorial layout for narrow viewports — no pin/scrub choreography.
 * Independent from reduced-motion; pass prefersReducedMotion to disable CSS accents.
 */
export function applyAboutMobileLayout(
  section: HTMLElement,
  typeWords: HTMLElement[],
  content: HTMLElement,
  options: ApplyAboutMobileLayoutOptions = {},
) {
  clearAboutAnimationStyles(section, typeWords, content)
  section.classList.remove('about-section--static')
  section.classList.add('about-section--mobile', 'about-section--type-ready')
  section.classList.toggle(
    'about-section--motion-reduced',
    Boolean(options.prefersReducedMotion),
  )
}
