export type AboutPresentationMode = 'mobile' | 'reduced-motion' | 'scroll'

export const ABOUT_MOBILE_MAX_WIDTH_PX = 700

export function isAboutMobileViewport(
  width = typeof window !== 'undefined' ? window.innerWidth : 0,
) {
  return width > 0 && width <= ABOUT_MOBILE_MAX_WIDTH_PX
}

/**
 * Mobile layout wins over reduced-motion for presentation mode selection:
 * both are static-flow, but mobile has its own editorial composition.
 */
export function selectAboutPresentationMode(options: {
  isMobile: boolean
  prefersReducedMotion: boolean
}): AboutPresentationMode {
  if (options.isMobile) return 'mobile'
  if (options.prefersReducedMotion) return 'reduced-motion'
  return 'scroll'
}
