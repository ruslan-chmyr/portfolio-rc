import { describe, expect, it } from 'vitest'
import { isAboutMobileViewport } from './applyAboutMobileLayout'

describe('isAboutMobileViewport', () => {
  it('treats phone widths as mobile', () => {
    expect(isAboutMobileViewport(440)).toBe(true)
    expect(isAboutMobileViewport(700)).toBe(true)
  })

  it('keeps tablet/desktop on the scrubbed layout', () => {
    expect(isAboutMobileViewport(701)).toBe(false)
    expect(isAboutMobileViewport(1280)).toBe(false)
  })
})
