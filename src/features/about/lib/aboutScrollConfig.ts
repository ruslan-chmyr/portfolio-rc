export const ABOUT_SCROLL = {
  /** Slightly longer than the storytelling span so the exit phase has scrub room. */
  pinViewportFactor: 3.35,
  minPinPx: 1760,
  scrub: 0.9,
  triggerStart: 'top top',
} as const

export const ABOUT_TYPE_ENTRANCE = {
  fromScale: 0.36,
  fromY: 32,
  fromOpacity: 0.25,
} as const

/** Final scale for headline words — large but clear of the content band. */
export const ABOUT_FINAL_WORD_SCALE = 0.6

/** Slightly smaller settle scale on short laptop viewports (e.g. 13" MacBook). */
export const ABOUT_FINAL_WORD_SCALE_COMPACT = 0.52

export function aboutFinalWordScale(): number {
  if (typeof window === 'undefined') return ABOUT_FINAL_WORD_SCALE
  const compact = window.matchMedia('(max-width: 1512px) and (max-height: 920px)').matches
  return compact ? ABOUT_FINAL_WORD_SCALE_COMPACT : ABOUT_FINAL_WORD_SCALE
}

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
  /** Brief hold after content is fully presented. */
  settledStart: 0.86,
  /** Restrained exit toward Skills — after storytelling, before pin release. */
  exitStart: 0.9,
} as const

/** Exit motion (scrubbed). Values are starting points for tuning. */
export const ABOUT_EXIT = {
  secondaryY: -28,
  typeY: -36,
  secondaryDuration: 0.045,
  ambientDuration: 0.05,
  typeDuration: 0.055,
  /** Pin → Skills navy; slightly longer than a flash on fast scrub. */
  pinFadeDuration: 0.07,
  /** Skills deep navy — bridges the theme About pin into the dark scene. */
  pinExitColor: '#05070f',
} as const

/**
 * About scrub progress to land on when returning from Skills in one gesture.
 * Settled content is visible; exit darkening has not taken over yet.
 */
export const ABOUT_RETURN_PROGRESS = ABOUT_TIMELINE.settledStart

export function aboutContentRevealStart(): number {
  return ABOUT_TIMELINE.contentRevealStart
}

export function aboutExitStart(): number {
  return ABOUT_TIMELINE.exitStart
}
