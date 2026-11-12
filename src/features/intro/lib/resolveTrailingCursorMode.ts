export type TrailingCursorMode = 'default' | 'interactive' | 'link' | 'drag' | 'native'

const EXPLICIT_SELECTOR = '[data-cursor]'
const NATIVE_SELECTOR = 'input, textarea, select, [contenteditable="true"]'
const DRAG_SELECTOR =
  '[data-cursor="drag"], .circular-carousel, [draggable="true"]'
const INTERACTIVE_SELECTOR = [
  'button',
  '[role="button"]',
  '[role="switch"]',
  '[role="menuitem"]',
  '[role="tab"]',
  'summary',
  'label[for]',
  '.theme-toggle',
  '.skills-category-toggle',
  '.skills-sound-toggle',
  '.skills-fallback__chip',
  '.skills-story-expanded__close',
  '.skills-keyboard__canvas',
  '.contact-form__submit',
  '.contact-links__copy',
  '.contact-links__social',
  '.experience-cv-cta__button:not(.experience-cv-cta__button--disabled)',
  '.portfolio-nav__menu-toggle',
].join(', ')
const LINK_SELECTOR = 'a[href]'

/**
 * Resolves a lightweight contextual cursor mode from a pointer event target.
 * Pure DOM walk — safe to call from pointermove without React state.
 */
export function resolveTrailingCursorMode(
  target: EventTarget | null,
): TrailingCursorMode {
  if (!(target instanceof Element)) return 'default'

  const explicit = target.closest(EXPLICIT_SELECTOR)
  if (explicit instanceof Element) {
    const mode = explicit.getAttribute('data-cursor')
    if (mode === 'drag' || mode === 'interactive' || mode === 'link' || mode === 'native') {
      return mode
    }
    if (mode === 'default') return 'default'
  }

  if (target.closest(NATIVE_SELECTOR)) return 'native'
  if (target.closest(DRAG_SELECTOR)) return 'drag'
  if (target.closest(INTERACTIVE_SELECTOR)) return 'interactive'

  const link = target.closest(LINK_SELECTOR)
  if (link instanceof Element) {
    // Chip / CTA anchors stay in the interactive family.
    if (
      link.matches(
        '.contact-links__social, .experience-cv-cta__button, .portfolio-nav__brand',
      )
    ) {
      return 'interactive'
    }
    return 'link'
  }

  return 'default'
}
