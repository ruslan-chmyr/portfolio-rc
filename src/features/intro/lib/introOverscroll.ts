/** Max visual pull in CSS pixels before hard clamp. */
export const INTRO_OVERSCROLL_MAX_PX = 96
/** Commit theme toggle once rubber-band tension reaches this (0–1). */
export const INTRO_OVERSCROLL_COMMIT = 0.72
/** Ignore tiny trackpad chatter while arming the pull. */
export const INTRO_OVERSCROLL_ARM_PX = 6
/** Wheel idle window — spring back if the user stops below the commit point. */
export const INTRO_OVERSCROLL_IDLE_MS = 160
/** Cooldown after a committed theme flip. */
export const INTRO_OVERSCROLL_COOLDOWN_MS = 900

/**
 * Rubber-band mapping: raw upward pull (positive px) → resisted display px.
 * Feels like iOS overscroll tension without needing large travel.
 */
export function resistOverscrollPull(
  rawPx: number,
  maxPx: number = INTRO_OVERSCROLL_MAX_PX,
): number {
  if (!(rawPx > 0) || !(maxPx > 0)) return 0
  // Slightly softer early curve so the tug reads sooner, then compresses.
  return maxPx * (1 - Math.exp(-rawPx / (maxPx * 0.88)))
}

/** Normalized tension 0–1 from resisted display pull. */
export function overscrollTension(
  displayPx: number,
  maxPx: number = INTRO_OVERSCROLL_MAX_PX,
): number {
  if (!(maxPx > 0)) return 0
  return Math.min(1, Math.max(0, displayPx / maxPx))
}

export function shouldCommitOverscroll(
  tension: number,
  commitAt: number = INTRO_OVERSCROLL_COMMIT,
): boolean {
  return tension >= commitAt
}
