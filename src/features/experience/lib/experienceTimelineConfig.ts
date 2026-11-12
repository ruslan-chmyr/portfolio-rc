/** Tokens and pure helpers for the Experience scroll timeline. */

export const EXPERIENCE_TIMELINE = {
  mobileMaxWidthPx: 960,
  /** Scrub lag — linked to scroll, not snappy. */
  scrub: 0.45,
  /**
   * Progress line ScrollTrigger window relative to the track.
   * start: when the track top reaches this viewport position.
   * end: when the track bottom reaches this viewport position.
   */
  progressStart: 'top 72%',
  progressEnd: 'bottom 28%',
  /**
   * Desktop intro pin (header + year) — CSS sticky fails under this page's
   * scrollport, so ScrollTrigger pins through the timeline column height.
   */
  /** Pinned inset from the viewport top (px). */
  introPinTopPx: 76,
  /**
   * Activate a milestone slightly before the progress tip reaches its center
   * so the node lights as the line arrives.
   */
  activateLead: 0.02,
  /** Clamp for measured thresholds. */
  minThreshold: 0.02,
  maxThreshold: 0.98,
} as const

export type ExperienceTimelineLayout = 'alternating' | 'single'

export function selectExperienceTimelineLayout(input: {
  isMobile: boolean
}): ExperienceTimelineLayout {
  return input.isMobile ? 'single' : 'alternating'
}

export function selectExperienceMotionMode(input: {
  prefersReducedMotion: boolean
}): 'scroll' | 'static' {
  return input.prefersReducedMotion ? 'static' : 'scroll'
}

/**
 * Map a milestone's center offset along the track into a 0–1 progress threshold.
 */
export function milestoneProgressThreshold(input: {
  nodeOffsetPx: number
  trackHeightPx: number
  activateLead?: number
}): number {
  const lead = input.activateLead ?? EXPERIENCE_TIMELINE.activateLead
  if (input.trackHeightPx <= 0) return EXPERIENCE_TIMELINE.minThreshold
  const raw = input.nodeOffsetPx / input.trackHeightPx - lead
  return Math.min(
    EXPERIENCE_TIMELINE.maxThreshold,
    Math.max(EXPERIENCE_TIMELINE.minThreshold, raw),
  )
}

/** Highest milestone index whose threshold is reached by `progress`. */
export function activeMilestoneIndex(
  progress: number,
  thresholds: readonly number[],
): number {
  let active = -1
  for (let i = 0; i < thresholds.length; i += 1) {
    if (progress + 1e-6 >= thresholds[i]!) active = i
  }
  return active
}

export function cardSideForIndex(
  index: number,
  layout: ExperienceTimelineLayout,
): 'left' | 'right' {
  if (layout === 'single') return 'right'
  // First entry right, then alternate.
  return index % 2 === 0 ? 'right' : 'left'
}
