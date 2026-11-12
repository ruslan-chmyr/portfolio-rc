import { describe, expect, it } from 'vitest'
import {
  PROJECTS_SCROLL,
  isSkillsEntranceDone,
  projectsExitDistancePx,
  projectsExitStartsAt,
  projectsNavReadyProgress,
  projectsScrubDistancePx,
  projectsTimelineDuration,
  projectsTotalPinDistancePx,
  resolveProjectsTriggerStart,
  selectProjectsPresentationMode,
} from './projectsScrollConfig'

describe('selectProjectsPresentationMode', () => {
  it('uses scroll motion on desktop without reduced motion', () => {
    expect(
      selectProjectsPresentationMode({
        isMobile: false,
        prefersReducedMotion: false,
      }),
    ).toBe('scroll')
  })

  it('falls back to static on mobile or reduced motion', () => {
    expect(
      selectProjectsPresentationMode({
        isMobile: true,
        prefersReducedMotion: false,
      }),
    ).toBe('static')
    expect(
      selectProjectsPresentationMode({
        isMobile: false,
        prefersReducedMotion: true,
      }),
    ).toBe('static')
  })
})

describe('projectsScrubDistancePx', () => {
  it('respects the minimum scrub floor', () => {
    expect(projectsScrubDistancePx(400)).toBe(PROJECTS_SCROLL.minScrubPx)
  })

  it('scales with tall viewports', () => {
    expect(projectsScrubDistancePx(1200)).toBe(1200 * PROJECTS_SCROLL.scrubViewportFactor)
  })
})

describe('projects exit distance', () => {
  it('adds an exit flight after the entrance scrub', () => {
    expect(projectsExitDistancePx(400)).toBe(PROJECTS_SCROLL.minExitPx)
    expect(projectsExitDistancePx(1200)).toBe(1200 * PROJECTS_SCROLL.exitViewportFactor)
    expect(projectsTotalPinDistancePx(1200)).toBe(
      projectsScrubDistancePx(1200) + projectsExitDistancePx(1200),
    )
    expect(projectsExitStartsAt()).toBeGreaterThan(PROJECTS_SCROLL.panelSlideDuration)
  })

  it('delays projects nav ownership until the wipe is complete', () => {
    const ready = projectsNavReadyProgress()
    expect(ready).toBeGreaterThan(0.35)
    expect(ready).toBeLessThan(0.6)
    expect(ready).toBeCloseTo(
      PROJECTS_SCROLL.panelSlideDuration / projectsTimelineDuration(),
      5,
    )
  })
})

describe('projects pin-spacer late handoff', () => {
  it('keeps exit tokens oriented left and up', () => {
    expect(PROJECTS_SCROLL.exitXPercent).toBeLessThan(0)
    expect(PROJECTS_SCROLL.exitYPercent).toBeLessThan(0)
  })
})

describe('resolveProjectsTriggerStart', () => {
  it('parks the trigger until Skills entrance is done', () => {
    const skills = {
      dataset: { skillsEntrance: 'pending' },
    } as unknown as HTMLElement
    expect(resolveProjectsTriggerStart(skills)).toContain('bottom')
  })

  it('uses the normal start once Skills entrance is done', () => {
    const skills = {
      dataset: { skillsEntrance: 'done' },
    } as unknown as HTMLElement
    expect(resolveProjectsTriggerStart(skills)).toBe(PROJECTS_SCROLL.triggerStart)
    expect(isSkillsEntranceDone(skills)).toBe(true)
  })
})
