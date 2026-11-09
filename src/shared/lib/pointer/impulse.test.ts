import { describe, expect, it } from 'vitest'
import {
  computePointerImpulse,
  desiredPointerPresence,
  smoothPresence,
} from './impulse'

const baseConfig = {
  simGrid: 128,
  presenceMin: 0.08,
  d60Min: 1e-5,
  maxFrameDistanceFactor: 0.09,
  gain: 0.52,
  kDivisor: 0.3,
  kScale: 1800,
}

describe('computePointerImpulse', () => {
  it('returns zero impulse when presence is too low', () => {
    const out = computePointerImpulse(
      {
        dt: 1 / 60,
        pointerInside: true,
        presence: 0.05,
        frameDx: 0.02,
        frameDy: 0,
        strength: 1,
      },
      baseConfig,
    )
    expect(out.canPush).toBe(false)
    expect(out.impulse).toEqual({ x: 0, y: 0 })
  })

  it('scales impulse with frame motion when push is allowed', () => {
    const out = computePointerImpulse(
      {
        dt: 1 / 60,
        pointerInside: true,
        presence: 0.9,
        frameDx: 0.04,
        frameDy: 0.03,
        strength: 1,
      },
      baseConfig,
    )
    expect(out.canPush).toBe(true)
    expect(out.impulse.x).not.toBe(0)
    expect(Math.sign(out.impulse.x)).toBe(1)
  })
})

describe('desiredPointerPresence', () => {
  it('is full strength shortly after an active pointer move', () => {
    expect(
      desiredPointerPresence(true, 0.05, 0, {
        activeSeconds: 0.75,
        proximityScale: 0.72,
        presenceMin: 0.18,
      }),
    ).toBe(1)
  })

  it('falls back to proximity beyond the active window', () => {
    expect(
      desiredPointerPresence(true, 2, 0.8, {
        activeSeconds: 0.75,
        proximityScale: 0.72,
        presenceMin: 0.18,
      }),
    ).toBeCloseTo(0.576, 3)
  })
})

describe('smoothPresence', () => {
  it('approaches the target exponentially', () => {
    const next = smoothPresence(0, 1, 0.1, 8)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(1)
  })
})
