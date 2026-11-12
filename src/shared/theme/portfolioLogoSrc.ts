import type { Theme } from './types'

export type PortfolioChromeSurface = 'intro' | 'portfolio' | 'immersive'

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

/**
 * Resolve the RC mark from the actual chrome surface luminance.
 * Immersive scenes (Skills/Projects) are always dark → white mark.
 * Portfolio chrome follows the inverted portfolio surface.
 */
export function chromeLogoSrc(
  theme: Theme,
  surface: PortfolioChromeSurface,
  assets: { onDarkBg: string; onLightBg: string },
): string {
  if (surface === 'immersive') return assets.onDarkBg
  if (surface === 'intro') {
    // Intro page luminance matches the theme name (light theme → light bg).
    return theme === 'light' ? assets.onLightBg : assets.onDarkBg
  }
  return portfolioLogoSrc(theme, assets)
}
