import { describe, expect, it } from 'vitest'
import {
  SPECTRAL_DRAPE,
  selectSpectralDrapeProfile,
} from './spectralDrapeConfig'

describe('spectralDrapeConfig', () => {
  it('keeps portfolio-safe palette tokens', () => {
    expect(SPECTRAL_DRAPE.background).toBe('#080F1D')
    expect(SPECTRAL_DRAPE.colors[0]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(SPECTRAL_DRAPE.colors[1]).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('reduces density on tablet and mobile', () => {
    const desktop = selectSpectralDrapeProfile({
      width: 1440,
      height: 900,
      prefersReducedMotion: false,
      viewportWidth: 1440,
    })
    const tablet = selectSpectralDrapeProfile({
      width: 768,
      height: 1024,
      prefersReducedMotion: false,
      viewportWidth: 768,
    })
    const mobile = selectSpectralDrapeProfile({
      width: 390,
      height: 844,
      prefersReducedMotion: false,
      viewportWidth: 390,
    })

    expect(desktop.density).toBeGreaterThan(tablet.density)
    expect(tablet.density).toBeGreaterThan(mobile.density)
    expect(desktop.cols * desktop.rows).toBeGreaterThan(tablet.cols * tablet.rows)
    expect(tablet.cols * tablet.rows).toBeGreaterThan(mobile.cols * mobile.rows)
  })

  it('freezes motion under prefers-reduced-motion', () => {
    const profile = selectSpectralDrapeProfile({
      width: 1440,
      height: 900,
      prefersReducedMotion: true,
      viewportWidth: 1440,
    })
    expect(profile.speed).toBe(0)
    expect(profile.paused).toBe(true)
    expect(profile.interactive).toBe(false)
  })
})
