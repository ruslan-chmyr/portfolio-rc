import { describe, expect, it } from 'vitest'
import { clamp01, smooth01 } from './introMath'

describe('clamp01', () => {
  it('clamps below zero and above one', () => {
    expect(clamp01(-0.2)).toBe(0)
    expect(clamp01(1.4)).toBe(1)
    expect(clamp01(0.45)).toBe(0.45)
  })
})

describe('smooth01', () => {
  it('is zero at the start and one at the end', () => {
    expect(smooth01(0)).toBe(0)
    expect(smooth01(1)).toBe(1)
  })

  it('stays within [0, 1] for interior values', () => {
    expect(smooth01(0.5)).toBeCloseTo(0.5, 5)
  })
})
