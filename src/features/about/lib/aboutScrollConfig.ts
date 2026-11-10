export const ABOUT_SCROLL = {
  pinViewportFactor: 3.15,
  minPinPx: 1680,
  scrub: 0.9,
  triggerStart: 'top top',
} as const

export const ABOUT_TYPE_ENTRANCE = {
  fromScale: 0.36,
  fromY: 32,
  fromOpacity: 0.25,
} as const

/** Final scale for headline words — large but clear of the content band. */
export const ABOUT_FINAL_WORD_SCALE = 0.54

/** Timeline position (0–1) where the final shrink begins — during the split, not after. */
export const ABOUT_FINAL_SHRINK_START = 0.46

/** Share of the split phase before FRONTEND leaves center and joins SENIOR. */
export const ABOUT_FRONTEND_JOIN_DELAY = 0.26

/** Relative positions on the single scrubbed timeline (0–1). */
export const ABOUT_TIMELINE = {
  scaleRevealEnd: 0.22,
  introEnd: 0.3,
  splitStart: 0.3,
  splitEnd: 0.78,
  contentRevealStart: 0.52,
  contentRevealDuration: 0.24,
  settledStart: 0.92,
} as const

export function aboutContentRevealStart(): number {
  return ABOUT_TIMELINE.contentRevealStart
}
