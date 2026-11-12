import { describe, expect, it } from 'vitest'
import {
  INTRO_OVERSCROLL_COMMIT,
  INTRO_OVERSCROLL_MAX_PX,
  overscrollTension,
  resistOverscrollPull,
  shouldCommitOverscroll,
} from './introOverscroll'

describe('resistOverscrollPull', () => {
  it('returns 0 for non-positive input', () => {
    expect(resistOverscrollPull(0)).toBe(0)
    expect(resistOverscrollPull(-12)).toBe(0)
  })

  it('approaches but stays under the max for large pulls', () => {
    const mild = resistOverscrollPull(20)
    const hard = resistOverscrollPull(240)
    expect(mild).toBeGreaterThan(0)
    expect(mild).toBeLessThan(hard)
    expect(hard).toBeLessThan(INTRO_OVERSCROLL_MAX_PX)
    expect(hard).toBeGreaterThan(INTRO_OVERSCROLL_MAX_PX * 0.9)
  })
})

describe('overscrollTension + commit', () => {
  it('normalizes display pull against the max', () => {
    expect(overscrollTension(0)).toBe(0)
    expect(overscrollTension(INTRO_OVERSCROLL_MAX_PX)).toBe(1)
    expect(overscrollTension(INTRO_OVERSCROLL_MAX_PX * 0.5)).toBeCloseTo(0.5, 5)
  })

  it('commits only at the configured threshold', () => {
    expect(shouldCommitOverscroll(INTRO_OVERSCROLL_COMMIT - 0.01)).toBe(false)
    expect(shouldCommitOverscroll(INTRO_OVERSCROLL_COMMIT)).toBe(true)
  })
})
