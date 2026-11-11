/**
 * Original Contact particle-fabric profile.
 * Tuned to echo Spectral Drape’s documented look (folds, depth, palette)
 * without using license-gated React Bits Pro source.
 */

export const SPECTRAL_DRAPE = {
  background: '#080F1D',
  /** Body dots → crest highlights (deeper blue → bright cyan for white Contact). */
  colors: ['#4B6FFF', '#9FE8FF'] as const,
  /** Desktop reference density ≈ particle count / 44_000. */
  desktopDensity: 0.85,
  tabletDensity: 0.52,
  mobileDensity: 0.32,
  maxDpr: 1.6,
  mobileMaxDpr: 1.25,
  strands: 8,
  amplitude: 1.05,
  frequency: 1.05,
  thickness: 0.85,
  depth: 1.45,
  softness: 0.58,
  intensity: 1.28,
  colorShift: 0.45,
  /**
   * Mesh orientation (degrees).
   * Matches Spectral Drape’s documented defaults closely so the sheet reads
   * as a turned cloth rather than a face-on grid.
   */
  tilt: -42,
  turn: -38,
  roll: 72,
  zoom: 1.15,
  flow: 0.9,
  speed: 0.68,
  /** Strong enough to read under the cursor; still mild for form use. */
  brush: 0.55,
  brushRadius: 0.22,
  parallax: 0.22,
  seed: 2.4,
  tabletMaxWidthPx: 960,
  mobileMaxWidthPx: 640,
} as const

export type SpectralDrapeProfile = {
  density: number
  maxDpr: number
  speed: number
  interactive: boolean
  paused: boolean
  cols: number
  rows: number
}

/**
 * Pick particle budget / motion for the current viewport + a11y prefs.
 * Particle counts stay well under Pro’s ~44k at density 1.
 */
export function selectSpectralDrapeProfile(input: {
  width: number
  height: number
  prefersReducedMotion: boolean
  viewportWidth: number
}): SpectralDrapeProfile {
  const { width, height, prefersReducedMotion, viewportWidth } = input
  const isMobile = viewportWidth <= SPECTRAL_DRAPE.mobileMaxWidthPx
  const isTablet =
    !isMobile && viewportWidth <= SPECTRAL_DRAPE.tabletMaxWidthPx

  const density = isMobile
    ? SPECTRAL_DRAPE.mobileDensity
    : isTablet
      ? SPECTRAL_DRAPE.tabletDensity
      : SPECTRAL_DRAPE.desktopDensity

  // dens=1 ≈ 44k → scale grid to area while keeping fabric continuity.
  const target = Math.round(44_000 * density)
  const aspect = Math.max(width, 1) / Math.max(height, 1)
  const rows = Math.max(36, Math.round(Math.sqrt(target / aspect)))
  const cols = Math.max(48, Math.round(rows * aspect))

  return {
    density,
    maxDpr: isMobile ? SPECTRAL_DRAPE.mobileMaxDpr : SPECTRAL_DRAPE.maxDpr,
    speed: prefersReducedMotion ? 0 : SPECTRAL_DRAPE.speed,
    interactive: !prefersReducedMotion && !isMobile,
    paused: prefersReducedMotion,
    cols: Math.min(cols, isMobile ? 90 : isTablet ? 140 : 220),
    rows: Math.min(rows, isMobile ? 70 : isTablet ? 100 : 150),
  }
}
