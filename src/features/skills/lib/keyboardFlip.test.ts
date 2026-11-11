import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_FLIP_SWAP_AT,
  easeInOutCubic,
  keyboardFlipLabelOpacity,
  keyboardFlipRotationX,
  shouldSwapKeyboardCategory,
} from './keyboardFlip'

describe('keyboardFlip', () => {
  it('eases with zero endpoints and a mid-range acceleration', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5)
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25)
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75)
  })

  it('keeps legends opaque until edge-on, then recovers after the underside swap', () => {
    expect(keyboardFlipLabelOpacity(0)).toBe(1)
    expect(keyboardFlipLabelOpacity(0.2)).toBe(1)
    expect(keyboardFlipLabelOpacity(KEYBOARD_FLIP_SWAP_AT)).toBe(0)
    expect(keyboardFlipLabelOpacity(0.35)).toBeGreaterThan(0)
    expect(keyboardFlipLabelOpacity(0.35)).toBeLessThan(1)
    expect(keyboardFlipLabelOpacity(0.85)).toBe(1)
    expect(keyboardFlipLabelOpacity(1)).toBe(1)
  })

  it('swaps category once at the underside (≈180°)', () => {
    expect(shouldSwapKeyboardCategory(0.49, false)).toBe(false)
    expect(shouldSwapKeyboardCategory(0.5, false)).toBe(true)
    expect(shouldSwapKeyboardCategory(0.9, true)).toBe(false)
  })

  it('rotates around local X for a full vertical revolution', () => {
    expect(keyboardFlipRotationX(0)).toBeCloseTo(0, 10)
    expect(keyboardFlipRotationX(0.5)).toBeCloseTo(Math.PI, 5)
    expect(keyboardFlipRotationX(1)).toBeCloseTo(Math.PI * 2, 5)
  })
})

