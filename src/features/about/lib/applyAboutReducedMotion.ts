import gsap from 'gsap'

export function applyAboutReducedMotion(section: HTMLElement, typeWords: HTMLElement[], content: HTMLElement) {
  const stage = section.querySelector<HTMLElement>('.about-hero-type__stage')
  if (stage) gsap.set(stage, { clearProps: 'all' })
  gsap.set(typeWords, { clearProps: 'all' })
  gsap.set(content, { autoAlpha: 1 })
  gsap.set(section.querySelectorAll('.about-content__reveal'), {
    clearProps: 'all',
    autoAlpha: 1,
    y: 0,
  })
  const ambientReveal = section.querySelector<HTMLElement>('.about-tech-ambient__reveal')
  if (ambientReveal) gsap.set(ambientReveal, { autoAlpha: 1 })
  section.classList.add('about-section--static', 'about-section--type-ready')
}
