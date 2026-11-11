import { clearAboutAnimationStyles } from './clearAboutAnimationStyles'

/** Accessible static presentation for desktop when motion is reduced. */
export function applyAboutReducedMotion(
  section: HTMLElement,
  typeWords: HTMLElement[],
  content: HTMLElement,
) {
  clearAboutAnimationStyles(section, typeWords, content)
  section.classList.remove('about-section--mobile', 'about-section--motion-reduced')
  section.classList.add('about-section--static', 'about-section--type-ready')
}
