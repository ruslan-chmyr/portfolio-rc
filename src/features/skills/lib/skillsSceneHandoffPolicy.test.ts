import { describe, expect, it } from 'vitest'
import {
  decideSkillsEntrance,
  isSkillsAligned,
  isWithinHandoffCooldown,
  nextSkillsHandoffPhase,
  resolvePhaseAfterAlignInterrupt,
  shouldBeginAboutAlign,
  shouldBeginSkillsAlign,
  shouldCatchSkillsOvershoot,
  SKILLS_HANDOFF,
} from './skillsSceneHandoffPolicy'

describe('shouldBeginSkillsAlign', () => {
  const base = {
    enabled: true,
    reducedMotion: false,
    isMobile: false,
    phase: 'idle' as const,
    direction: 1 as const,
    skillsTop: 520,
    viewportHeight: 900,
    blocked: false,
  }

  it('starts align when scrolling down once Skills peeks into the dark viewport', () => {
    expect(shouldBeginSkillsAlign(base)).toBe(true)
    expect(shouldBeginSkillsAlign({ ...base, skillsTop: 800 })).toBe(true)
  })

  it('ignores reverse, mobile, reduced motion, blockers, and active aligns', () => {
    expect(shouldBeginSkillsAlign({ ...base, direction: -1 })).toBe(false)
    expect(shouldBeginSkillsAlign({ ...base, isMobile: true })).toBe(false)
    expect(shouldBeginSkillsAlign({ ...base, reducedMotion: true })).toBe(false)
    expect(shouldBeginSkillsAlign({ ...base, blocked: true })).toBe(false)
    expect(shouldBeginSkillsAlign({ ...base, phase: 'settled' })).toBe(false)
    expect(shouldBeginSkillsAlign({ ...base, phase: 'aligning-skills' })).toBe(false)
  })

  it('does not align when Skills is already at the top or still far below', () => {
    expect(shouldBeginSkillsAlign({ ...base, skillsTop: 2 })).toBe(false)
    expect(
      shouldBeginSkillsAlign({
        ...base,
        skillsTop: SKILLS_HANDOFF.approachBandPx(900) + 40,
      }),
    ).toBe(false)
  })
})

describe('shouldBeginAboutAlign', () => {
  const base = {
    enabled: true,
    reducedMotion: false,
    isMobile: false,
    phase: 'settled' as const,
    direction: -1 as const,
    skillsTop: 0,
    viewportHeight: 900,
    blocked: false,
    aboutReturnScrollY: 2400,
    currentScrollY: 3100,
  }

  it('starts reverse align on one upward gesture from Skills', () => {
    expect(shouldBeginAboutAlign(base)).toBe(true)
    expect(shouldBeginAboutAlign({ ...base, skillsTop: 40 })).toBe(true)
  })

  it('ignores forward scroll, missing targets, and already-returned frames', () => {
    expect(shouldBeginAboutAlign({ ...base, direction: 1 })).toBe(false)
    expect(shouldBeginAboutAlign({ ...base, blocked: true })).toBe(false)
    expect(shouldBeginAboutAlign({ ...base, aboutReturnScrollY: null })).toBe(false)
    expect(
      shouldBeginAboutAlign({
        ...base,
        currentScrollY: 2400,
      }),
    ).toBe(false)
  })

  it('does not steal reverse scroll once later sections own the viewport', () => {
    expect(
      shouldBeginAboutAlign({
        ...base,
        phase: 'passed',
        skillsTop: -400,
      }),
    ).toBe(false)
  })
})

describe('resolvePhaseAfterAlignInterrupt', () => {
  it('maps canceled Skills align to the nearest coherent phase', () => {
    expect(
      resolvePhaseAfterAlignInterrupt({
        wasAligning: 'aligning-skills',
        skillsTop: 2,
        viewportHeight: 900,
      }),
    ).toBe('settled')
    expect(
      resolvePhaseAfterAlignInterrupt({
        wasAligning: 'aligning-skills',
        skillsTop: 600,
        viewportHeight: 900,
      }),
    ).toBe('idle')
  })

  it('keeps a short cooldown after align cancel/complete', () => {
    expect(isWithinHandoffCooldown(1000, 1200)).toBe(true)
    expect(isWithinHandoffCooldown(1300, 1200)).toBe(false)
  })
})

describe('nextSkillsHandoffPhase', () => {
  it('settles after skills align', () => {
    expect(
      nextSkillsHandoffPhase({
        phase: 'aligning-skills',
        skillsTop: 2,
        direction: 1,
      }),
    ).toBe('settled')
  })

  it('marks passed when scrolling deeper into Skills', () => {
    expect(
      nextSkillsHandoffPhase({ phase: 'settled', skillsTop: -40, direction: 1 }),
    ).toBe('passed')
  })
})

describe('decideSkillsEntrance', () => {
  it('plays once when the scene aligns on desktop', () => {
    expect(
      decideSkillsEntrance({
        hasPlayed: false,
        reducedMotion: false,
        isMobile: false,
        sceneAligned: true,
      }),
    ).toEqual({ kind: 'full' })
  })

  it('skips replays and waits for alignment', () => {
    expect(
      decideSkillsEntrance({
        hasPlayed: true,
        reducedMotion: false,
        isMobile: false,
        sceneAligned: true,
      }),
    ).toEqual({ kind: 'skip' })
    expect(
      decideSkillsEntrance({
        hasPlayed: false,
        reducedMotion: false,
        isMobile: false,
        sceneAligned: false,
      }),
    ).toEqual({ kind: 'skip' })
  })

  it('uses instant reveal for mobile / reduced motion', () => {
    expect(
      decideSkillsEntrance({
        hasPlayed: false,
        reducedMotion: true,
        isMobile: false,
        sceneAligned: true,
      }),
    ).toEqual({ kind: 'instant' })
    expect(
      decideSkillsEntrance({
        hasPlayed: false,
        reducedMotion: false,
        isMobile: true,
        sceneAligned: true,
      }),
    ).toEqual({ kind: 'instant' })
  })
})

describe('isSkillsAligned', () => {
  it('accepts near-zero tops within tolerance', () => {
    expect(isSkillsAligned(0)).toBe(true)
    expect(isSkillsAligned(4)).toBe(true)
    expect(isSkillsAligned(20)).toBe(false)
  })
})

describe('shouldCatchSkillsOvershoot', () => {
  it('settles when a fast downward jump lands near the Skills top', () => {
    expect(
      shouldCatchSkillsOvershoot({
        enabled: true,
        reducedMotion: false,
        isMobile: false,
        phase: 'idle',
        direction: 1,
        skillsTop: -8,
        viewportHeight: 900,
        blocked: false,
      }),
    ).toBe(true)
  })
})
