import { describe, expect, it } from 'vitest'
import {
  EXPERIENCE_TIMELINE,
  activeMilestoneIndex,
  cardSideForIndex,
  milestoneProgressThreshold,
  selectExperienceMotionMode,
  selectExperienceTimelineLayout,
} from './experienceTimelineConfig'

describe('experienceTimelineConfig', () => {
  it('selects alternating layout on desktop and single on mobile', () => {
    expect(selectExperienceTimelineLayout({ isMobile: false })).toBe('alternating')
    expect(selectExperienceTimelineLayout({ isMobile: true })).toBe('single')
  })

  it('disables scroll motion under reduced motion', () => {
    expect(selectExperienceMotionMode({ prefersReducedMotion: true })).toBe('static')
    expect(selectExperienceMotionMode({ prefersReducedMotion: false })).toBe('scroll')
  })

  it('maps node offsets into clamped progress thresholds', () => {
    expect(
      milestoneProgressThreshold({
        nodeOffsetPx: 0,
        trackHeightPx: 1000,
      }),
    ).toBe(EXPERIENCE_TIMELINE.minThreshold)

    expect(
      milestoneProgressThreshold({
        nodeOffsetPx: 500,
        trackHeightPx: 1000,
        activateLead: 0.02,
      }),
    ).toBeCloseTo(0.48)

    expect(
      milestoneProgressThreshold({
        nodeOffsetPx: 1000,
        trackHeightPx: 1000,
      }),
    ).toBe(EXPERIENCE_TIMELINE.maxThreshold)
  })

  it('resolves the active milestone for forward and reverse progress', () => {
    const thresholds = [0.2, 0.5, 0.8]
    expect(activeMilestoneIndex(0.1, thresholds)).toBe(-1)
    expect(activeMilestoneIndex(0.2, thresholds)).toBe(0)
    expect(activeMilestoneIndex(0.55, thresholds)).toBe(1)
    expect(activeMilestoneIndex(0.9, thresholds)).toBe(2)
    expect(activeMilestoneIndex(0.49, thresholds)).toBe(0)
  })

  it('alternates card sides starting on the right', () => {
    expect(cardSideForIndex(0, 'alternating')).toBe('right')
    expect(cardSideForIndex(1, 'alternating')).toBe('left')
    expect(cardSideForIndex(2, 'alternating')).toBe('right')
    expect(cardSideForIndex(0, 'single')).toBe('right')
    expect(cardSideForIndex(1, 'single')).toBe('right')
  })
})
