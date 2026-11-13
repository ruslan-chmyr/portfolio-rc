import { isSkillsEntranceDone } from '../../../shared/scene/portfolioScene'

/** Scroll / geometry tokens for the Projects blue-panel entrance + exit. */
export const PROJECTS_SCROLL = {
  /**
   * Longer scrub distance so the cover reads as a deliberate wipe
   * over Skills, not an instant page swap.
   */
  scrubViewportFactor: 1.75,
  minScrubPx: 1080,
  /** Softer scrub lag — connected to scroll, but not snappy. */
  scrub: 0.75,
  /**
   * Extra Skills dwell before the wipe starts (~10–15% more scroll).
   */
  triggerStart: 'top+=12vh top',
  /** Match Skills handoff mobile cutoff — pin/slide is desktop-only. */
  mobileMaxWidthPx: 960,
  /** Skills deep navy — gutters stay on-theme while Skills content fades. */
  sceneBackdrop: '#05070f',
  /** Timeline segment lengths (share of the scrubbed timeline = 1). */
  panelSlideDuration: 1,
  /**
   * Highlights sit under the first part of the wipe — ease them out as soon
   * as the blue panel starts covering the right column.
   */
  highlightsFadeAt: 0.04,
  highlightsFadeDuration: 0.48,
  /**
   * Keyboard / left Skills stay visible through the early cover; fade once
   * the panel owns most of the frame — no hard black flash.
   */
  skillsFadeAt: 0.42,
  skillsFadeDuration: 0.55,
  /** Navy pin backdrop once Skills is mostly covered — avoids late gutter flash. */
  pinBackdropAt: 0.56,
  pinBackdropDuration: 0.4,
  settleHoldDuration: 0.2,
  /**
   * After Projects settles, scrub the blue scene out left + up so Experience
   * can continue as a normal document-flow page.
   */
  exitViewportFactor: 0.95,
  minExitPx: 640,
  exitDuration: 1,
  exitXPercent: -72,
  exitYPercent: -118,
  /**
   * Reveal Experience immediately as the panel leaves — pin fades with the
   * flight so there is no empty gap before the next page.
   */
  exitFadeAt: 0,
  /** Slightly longer pin fade so Experience reads under the flight. */
  exitFadeDuration: 1,
} as const

/** @deprecated Prefer `shared/scene/portfolioScene`. */
export {
  SKILLS_ENTRANCE_DONE_EVENT,
  isSkillsEntranceDone,
} from '../../../shared/scene/portfolioScene'

export type ProjectsPresentationMode = 'scroll' | 'static'

export function selectProjectsPresentationMode(input: {
  isMobile: boolean
  prefersReducedMotion: boolean
}): ProjectsPresentationMode {
  if (input.isMobile || input.prefersReducedMotion) return 'static'
  return 'scroll'
}

/** Entrance scrub only (Skills wipe → settled Projects). */
export function projectsScrubDistancePx(viewportHeight: number): number {
  return Math.max(
    PROJECTS_SCROLL.minScrubPx,
    viewportHeight * PROJECTS_SCROLL.scrubViewportFactor,
  )
}

/** Exit scrub (Projects leaves → Experience owns normal scroll). */
export function projectsExitDistancePx(viewportHeight: number): number {
  return Math.max(
    PROJECTS_SCROLL.minExitPx,
    viewportHeight * PROJECTS_SCROLL.exitViewportFactor,
  )
}

/** Full Projects pin distance: entrance + exit. */
export function projectsTotalPinDistancePx(viewportHeight: number): number {
  return projectsScrubDistancePx(viewportHeight) + projectsExitDistancePx(viewportHeight)
}

/** Timeline time where entrance settle ends and the exit flight begins. */
export function projectsExitStartsAt(): number {
  return (
    Math.max(
      PROJECTS_SCROLL.panelSlideDuration,
      PROJECTS_SCROLL.highlightsFadeAt + PROJECTS_SCROLL.highlightsFadeDuration,
      PROJECTS_SCROLL.skillsFadeAt + PROJECTS_SCROLL.skillsFadeDuration,
      PROJECTS_SCROLL.pinBackdropAt + PROJECTS_SCROLL.pinBackdropDuration,
    ) + PROJECTS_SCROLL.settleHoldDuration
  )
}

/** Total scrubbed timeline length (entrance settle + exit flight). */
export function projectsTimelineDuration(): number {
  return projectsExitStartsAt() + PROJECTS_SCROLL.exitDuration
}

/**
 * ScrollTrigger progress (0–1) where chrome may switch to Projects.
 * Default: panel fully wiped in (xPercent ≈ 0), still before the exit flight.
 */
export function projectsNavReadyProgress(
  wipeCompleteRatio = 1,
): number {
  const ratio = Math.min(1, Math.max(0, wipeCompleteRatio))
  return (
    (PROJECTS_SCROLL.panelSlideDuration * ratio) / projectsTimelineDuration()
  )
}

/**
 * Safe programmatic landing inside Projects ownership.
 * Past the nav-ready threshold, before the exit flight — avoids chrome flicker
 * when rounding lands exactly on the ownership boundary.
 */
export function projectsNavLandingProgress(): number {
  const ready = projectsNavReadyProgress()
  const exitStart = projectsExitStartsAt() / projectsTimelineDuration()
  if (!(exitStart > ready)) return Math.min(0.99, ready + 0.02)
  const landing = ready + (exitStart - ready) * 0.2
  return Math.min(landing, exitStart - 0.01)
}

/** Park the trigger until Skills has finished entering, then use the normal start. */
export function resolveProjectsTriggerStart(skills: HTMLElement | null): string {
  if (!isSkillsEntranceDone(skills)) return 'bottom+=150% bottom'
  return PROJECTS_SCROLL.triggerStart
}
