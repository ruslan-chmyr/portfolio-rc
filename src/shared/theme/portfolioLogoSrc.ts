import type { Theme } from './types'

/**
 * Portfolio (and Contact) surfaces invert relative to the theme name:
 * - light → black surface → white mark
 * - dark → white surface → dark mark
 *
 * `Theme` describes intro appearance; do not map logo assets from the theme
 * name as if it were page luminance.
 */
export function portfolioLogoSrc(
  theme: Theme,
  assets: { onDarkBg: string; onLightBg: string },
): string {
  return theme === 'light' ? assets.onDarkBg : assets.onLightBg
}
