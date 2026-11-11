/**
 * Vertical forward flip (local X axis) for FE ↔ AI category changes.
 * Positive X rotation flips the board the opposite way through a full revolution.
 */
export const KEYBOARD_FLIP_MS = 1100

/**
 * Pivot at the keyboard's physical center (midway between key tops and case bottom).
 * XZ centering is handled by the scene; this only sets the flip axis height.
 */
export const KEYBOARD_FLIP_PIVOT_Y = -0.1

/** Progress window where legends fade while the board is edge-on / underside-out. */
export const KEYBOARD_FLIP_FADE_OUT_START = 0.28
export const KEYBOARD_FLIP_SWAP_AT = 0.5
export const KEYBOARD_FLIP_FADE_IN_END = 0.72

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/**
 * Legend opacity over flip progress. Fade while faces are edge-on / hidden,
 * swap at the underside, then recover before the board settles.
 */
export function keyboardFlipLabelOpacity(progress: number): number {
  const t = Math.min(1, Math.max(0, progress))
  if (t < KEYBOARD_FLIP_FADE_OUT_START) return 1
  if (t < KEYBOARD_FLIP_SWAP_AT) {
    const u =
      (t - KEYBOARD_FLIP_FADE_OUT_START) /
      (KEYBOARD_FLIP_SWAP_AT - KEYBOARD_FLIP_FADE_OUT_START)
    return 1 - u
  }
  if (t < KEYBOARD_FLIP_FADE_IN_END) {
    const u =
      (t - KEYBOARD_FLIP_SWAP_AT) / (KEYBOARD_FLIP_FADE_IN_END - KEYBOARD_FLIP_SWAP_AT)
    return u
  }
  return 1
}

export function shouldSwapKeyboardCategory(
  progress: number,
  alreadySwapped: boolean,
): boolean {
  return !alreadySwapped && progress >= KEYBOARD_FLIP_SWAP_AT
}

/** Vertical revolution around local X (radians), opposite of the previous direction. */
export function keyboardFlipRotationX(easedProgress: number): number {
  return easedProgress * Math.PI * 2
}
