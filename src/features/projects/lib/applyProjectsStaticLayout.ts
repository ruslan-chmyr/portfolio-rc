import gsap from 'gsap'

/**
 * Reduced-motion / mobile: panel rests in final geometry with no slide or pin.
 */
export function applyProjectsStaticLayout(
  section: HTMLElement,
  panel: HTMLElement,
): () => void {
  section.classList.add('projects-section--static')
  section.dataset.projectsMotion = 'static'

  gsap.set(panel, {
    xPercent: 0,
    clearProps: 'transform',
  })
  panel.style.willChange = ''
  panel.style.transform = ''

  return () => {
    section.classList.remove('projects-section--static')
    delete section.dataset.projectsMotion
  }
}
