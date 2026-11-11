import gsap from 'gsap'

/** Clears GSAP inline styles left by the desktop scrub timeline. */
export function clearAboutAnimationStyles(
  section: HTMLElement,
  typeWords: HTMLElement[],
  content: HTMLElement,
) {
  const stage = section.querySelector<HTMLElement>('.about-hero-type__stage')
  if (stage) gsap.set(stage, { clearProps: 'all' })
  gsap.set(typeWords, { clearProps: 'all' })
  gsap.set(content, { clearProps: 'all', autoAlpha: 1 })
  gsap.set(section.querySelectorAll('.about-content__reveal'), {
    clearProps: 'all',
    autoAlpha: 1,
    y: 0,
  })
  const ambientReveal = section.querySelector<HTMLElement>('.about-tech-ambient__reveal')
  if (ambientReveal) gsap.set(ambientReveal, { clearProps: 'all', autoAlpha: 1 })
  const indexEl = section.querySelector<HTMLElement>('.about-section__index-column')
  if (indexEl) gsap.set(indexEl, { clearProps: 'all', autoAlpha: 1 })
}
