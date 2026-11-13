import { describe, expect, it } from 'vitest'
import { easeInOutCubic, lerp, smoothstep } from './bookMotion'

describe('bookMotion', () => {
  it('easing hits hard endpoints', () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(1)).toBe(1)
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(lerp(2, 8, 0.5)).toBe(5)
  })
})
