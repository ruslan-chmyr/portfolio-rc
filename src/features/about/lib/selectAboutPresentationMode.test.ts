import { describe, expect, it } from 'vitest'
import {
  isAboutMobileViewport,
  selectAboutPresentationMode,
} from './selectAboutPresentationMode'

describe('selectAboutPresentationMode', () => {
  it('prefers mobile over reduced-motion and scroll', () => {
    expect(
      selectAboutPresentationMode({ isMobile: true, prefersReducedMotion: true }),
    ).toBe('mobile')
    expect(
      selectAboutPresentationMode({ isMobile: true, prefersReducedMotion: false }),
    ).toBe('mobile')
  })

  it('uses reduced-motion on desktop when requested', () => {
    expect(
      selectAboutPresentationMode({ isMobile: false, prefersReducedMotion: true }),
    ).toBe('reduced-motion')
  })

  it('uses scroll choreography on desktop with normal motion', () => {
    expect(
      selectAboutPresentationMode({ isMobile: false, prefersReducedMotion: false }),
    ).toBe('scroll')
  })
})

describe('isAboutMobileViewport', () => {
  it('treats 320–700 as mobile and 701+ as desktop', () => {
    expect(isAboutMobileViewport(320)).toBe(true)
    expect(isAboutMobileViewport(390)).toBe(true)
    expect(isAboutMobileViewport(700)).toBe(true)
    expect(isAboutMobileViewport(701)).toBe(false)
    expect(isAboutMobileViewport(1440)).toBe(false)
  })
})
