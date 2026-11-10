import { describe, expect, it } from 'vitest'
import { ABOUT_SCROLL, ABOUT_TIMELINE, aboutContentRevealStart } from '../lib/aboutScrollConfig'

describe('aboutScrollConfig', () => {
  it('defines stable scrub timing and minimum travel', () => {
    expect(ABOUT_SCROLL.minPinPx).toBeGreaterThan(500)
    expect(ABOUT_SCROLL.pinViewportFactor).toBeGreaterThan(1)
    expect(ABOUT_SCROLL.scrub).toBeGreaterThan(0)
  })

  it('keeps timeline phases in order', () => {
    expect(ABOUT_TIMELINE.scaleRevealEnd).toBeLessThan(ABOUT_TIMELINE.introEnd)
    expect(ABOUT_TIMELINE.introEnd).toBe(ABOUT_TIMELINE.splitStart)
    expect(ABOUT_TIMELINE.introEnd).toBeLessThan(ABOUT_TIMELINE.splitEnd)
    expect(aboutContentRevealStart()).toBeGreaterThan(ABOUT_TIMELINE.splitStart)
    expect(aboutContentRevealStart()).toBeLessThan(ABOUT_TIMELINE.splitEnd)
  })
})
