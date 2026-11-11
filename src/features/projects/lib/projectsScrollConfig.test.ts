import { describe, expect, it } from 'vitest'
import {
  PROJECTS_SCROLL,
  isSkillsEntranceDone,
  projectsScrubDistancePx,
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
