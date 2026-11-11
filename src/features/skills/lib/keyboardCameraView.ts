/**
 * Centralized isometric three-quarter view knobs.
 * Tune these without touching framing math or keyboard geometry.
 *
 * Negative azimuth flips the product shot so the board reads
 * lower-left → upper-right (matching the approved Skills reference).
 */
export const KEYBOARD_CAMERA_VIEW = {
  elevationDeg: 46,
  /** Opposite diagonal from the earlier +36° composition. */
  azimuthDeg: -38,
  /**
   * Safe margin after projected-AABB fit (~7%).
   * Target on-screen keyboard ≈ 85–90% of the usable stage.
   */
  padding: 1.07,
  baseFov: 30,
  narrowFov: 36,
  /**
   * Look-at height. Slightly below the plate so the macropad sits ~10–15%
   * higher in the Canvas under the inspection band.
   */
  targetY: -0.45,
  /**
   * Small vertical NDC reserve for shadows / residual tilt — not for HTML inspection.
   */
  topInset: 0.04,
  boardTiltX: -0.045,
  boardTiltY: -0.05,
  boardTiltZ: -0.012,
  /** Pointer parallax (radians) — keep low so legends stay readable. */
  parallaxX: 0.018,
  parallaxY: 0.03,
} as const

export type KeyboardCameraViewConfig = typeof KEYBOARD_CAMERA_VIEW
