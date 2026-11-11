/**
 * Pure decision helpers for the About → Skills fullscreen scene handoff.
 * Controllers call these so scroll behavior stays testable without DOM/GSAP.
 */

export type SkillsHandoffPhase =
  | 'idle'
  | 'aligning-skills'
  | 'settled'
  | 'passed'
  | 'aligning-about'

export const SKILLS_HANDOFF = {
  /**
   * Forward snap once Skills has entered the viewport (dark About exit already
   * visible). Almost a full viewport — matches “screen went dark, peek of Skills”.
   */
  approachBandPx: (viewportHeight: number) => Math.max(120, viewportHeight * 0.92),
  /** How close to 0 counts as Skills-aligned. */
  settleTolerancePx: 6,
  /** Leave settled when Skills has scrolled fully above the viewport. */
  passedTopPx: -24,
  /** Forward settle into Skills. */
  forwardAlignDuration: 0.62,
  /** Reverse settle into About — slightly longer for a softer ease-out. */
  reverseAlignDuration: 0.72,
  /** Theme background catch-up while reversing into About. */
  themeBgDuration: 0.38,
  mobileMaxWidthPx: 960,
  /**
   * After canceling or completing an align, ignore residual trackpad momentum
   * that would immediately re-trigger the opposite snap.
   */
  postAlignCooldownMs: 220,
  /** Deep past Skills — later sections own scroll; do not yank back to About. */
  aboutAlignMinTopFactor: -0.18,
} as const

export type SkillsAlignDecisionInput = {
  enabled: boolean
  reducedMotion: boolean
  isMobile: boolean
  phase: SkillsHandoffPhase
  /** Positive = scrolling down. */
  direction: 1 | -1 | 0
  skillsTop: number
  viewportHeight: number
  /** Story Focus / other blockers that must not fight scroll. */
  blocked: boolean
}

export function shouldBeginSkillsAlign(input: SkillsAlignDecisionInput): boolean {
  if (!input.enabled || input.reducedMotion || input.isMobile || input.blocked) {
    return false
  }
  if (input.phase !== 'idle' && input.phase !== 'passed') return false
  if (input.direction !== 1) return false
  const band = SKILLS_HANDOFF.approachBandPx(input.viewportHeight)
  return input.skillsTop > SKILLS_HANDOFF.settleTolerancePx && input.skillsTop <= band
}

/**
 * Fast trackpads can jump past the approach band in one frame.
 * Treat a near-top (or just-past) Skills frame as already aligned.
 */
export function shouldCatchSkillsOvershoot(input: SkillsAlignDecisionInput): boolean {
  if (!input.enabled || input.reducedMotion || input.isMobile || input.blocked) {
    return false
  }
  if (input.phase !== 'idle' && input.phase !== 'passed') return false
  if (input.direction !== 1) return false
  return (
    input.skillsTop <= SKILLS_HANDOFF.settleTolerancePx &&
    input.skillsTop > SKILLS_HANDOFF.passedTopPx - input.viewportHeight * 0.15
  )
}

export type AboutAlignDecisionInput = {
  enabled: boolean
  reducedMotion: boolean
  isMobile: boolean
  phase: SkillsHandoffPhase
  direction: 1 | -1 | 0
  skillsTop: number
  viewportHeight: number
  blocked: boolean
  /** Absolute document Y for the About return target (settled scrub). */
  aboutReturnScrollY: number | null
  currentScrollY: number
}

/**
 * One-gesture reverse: any upward intent from the Skills scene snaps back to the
 * settled About frame (theme surface), not an intermediate dark band.
 */
export function shouldBeginAboutAlign(input: AboutAlignDecisionInput): boolean {
  if (!input.enabled || input.reducedMotion || input.isMobile || input.blocked) {
    return false
  }
  if (input.direction !== -1) return false
  if (input.phase !== 'settled' && input.phase !== 'passed') return false
  if (input.aboutReturnScrollY == null) return false
  // Already at/above the return frame.
  if (input.currentScrollY <= input.aboutReturnScrollY + SKILLS_HANDOFF.settleTolerancePx) {
    return false
  }
  // Still in the Skills scene (top near viewport). Ignore deep later sections.
  const maxTop = input.viewportHeight * 0.55
  const minTop = input.viewportHeight * SKILLS_HANDOFF.aboutAlignMinTopFactor
  return input.skillsTop < maxTop && input.skillsTop > minTop
}

/** Map viewport position after the user cancels a programmatic align. */
export function resolvePhaseAfterAlignInterrupt(input: {
  wasAligning: 'aligning-skills' | 'aligning-about'
  skillsTop: number
  viewportHeight: number
}): SkillsHandoffPhase {
  const { wasAligning, skillsTop, viewportHeight } = input
  if (wasAligning === 'aligning-skills') {
    if (isSkillsAligned(skillsTop)) return 'settled'
    if (skillsTop <= SKILLS_HANDOFF.passedTopPx) return 'passed'
    if (skillsTop > viewportHeight * 0.55) return 'idle'
    return 'idle'
  }
  // Interrupted About reverse — land based on where Skills sits now.
  if (isSkillsAligned(skillsTop)) return 'settled'
  if (skillsTop <= SKILLS_HANDOFF.passedTopPx) return 'passed'
  if (skillsTop > viewportHeight * 0.55) return 'idle'
  return 'settled'
}

export function isWithinHandoffCooldown(
  nowMs: number,
  cooldownUntilMs: number,
): boolean {
  return nowMs < cooldownUntilMs
}

export function isSkillsAligned(skillsTop: number, tolerancePx?: number) {
  const tolerance = tolerancePx ?? SKILLS_HANDOFF.settleTolerancePx
  return Math.abs(skillsTop) <= tolerance
}

export function isAboutReturnAligned(
  currentScrollY: number,
  aboutReturnScrollY: number,
  tolerancePx?: number,
) {
  const tolerance = tolerancePx ?? SKILLS_HANDOFF.settleTolerancePx
  return Math.abs(currentScrollY - aboutReturnScrollY) <= tolerance
}

export type SkillsPhaseAdvanceInput = {
  phase: SkillsHandoffPhase
  skillsTop: number
  direction: 1 | -1 | 0
}

export function nextSkillsHandoffPhase(input: SkillsPhaseAdvanceInput): SkillsHandoffPhase {
  const { phase, skillsTop, direction } = input

  if (phase === 'aligning-skills') {
    if (isSkillsAligned(skillsTop)) return 'settled'
    if (direction === -1) return 'settled'
    return 'aligning-skills'
  }

  if (phase === 'aligning-about') {
    if (direction === 1) return 'idle'
    return 'aligning-about'
  }

  if (phase === 'settled') {
    if (skillsTop <= SKILLS_HANDOFF.passedTopPx && direction === 1) return 'passed'
    return 'settled'
  }

  if (phase === 'passed') {
    if (isSkillsAligned(skillsTop) && direction === -1) return 'settled'
    if (skillsTop > 480) return 'idle'
    return 'passed'
  }

  return 'idle'
}

export type SkillsEntranceDecision =
  | { kind: 'skip' }
  | { kind: 'instant' }
  | { kind: 'full' }

export function decideSkillsEntrance(input: {
  hasPlayed: boolean
  reducedMotion: boolean
  isMobile: boolean
  sceneAligned: boolean
}): SkillsEntranceDecision {
  if (input.hasPlayed) return { kind: 'skip' }
  if (input.reducedMotion || input.isMobile) return { kind: 'instant' }
  if (!input.sceneAligned) return { kind: 'skip' }
  return { kind: 'full' }
}
