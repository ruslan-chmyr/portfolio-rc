import { describe, expect, it } from 'vitest'
import {
  angleError,
  isBonePoseSettled,
  isBookFullySettled,
} from './bookPageSettle'

describe('bookPageSettle', () => {
  it('measures shortest angular error', () => {
    expect(angleError(0, 0)).toBeCloseTo(0)
    expect(angleError(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2)
    expect(angleError(-Math.PI / 2, Math.PI / 2)).toBeCloseTo(Math.PI)
  })

  it('detects bone pose convergence', () => {
    expect(isBonePoseSettled(1.0, 1.0, 0, 0)).toBe(true)
    expect(isBonePoseSettled(0, 0.5, 0, 0)).toBe(false)
  })

  it('requires page index and bones before full settle', () => {
    expect(
      isBookFullySettled({
        targetPage: 0,
        visualPage: 0,
        bonesSettled: true,
      }),
    ).toBe(true)
    expect(
      isBookFullySettled({
        targetPage: 0,
        visualPage: 2,
        bonesSettled: true,
      }),
    ).toBe(false)
    expect(
      isBookFullySettled({
        targetPage: 0,
        visualPage: 0,
        bonesSettled: false,
      }),
    ).toBe(false)
  })

  it('rejects unlock while bones are marked unsettled after a visual step', () => {
    // Models Close Book after delayedPage reaches 0 but before bone convergence:
    // target and visual match, yet bonesSettled must be false until sheets report.
    expect(
      isBookFullySettled({
        targetPage: 0,
        visualPage: 0,
        bonesSettled: false,
      }),
    ).toBe(false)
  })
})
