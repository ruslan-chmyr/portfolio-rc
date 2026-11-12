import { describe, expect, it } from 'vitest'
import { portfolioLogoSrc } from './portfolioLogoSrc'

const assets = {
  onDarkBg: 'logo-white.svg',
  onLightBg: 'logo-dark.svg',
}

describe('portfolioLogoSrc', () => {
  it('uses the white mark on the black portfolio surface (light theme)', () => {
    expect(portfolioLogoSrc('light', assets)).toBe('logo-white.svg')
  })

  it('uses the dark mark on the white portfolio surface (dark theme)', () => {
    expect(portfolioLogoSrc('dark', assets)).toBe('logo-dark.svg')
  })
})
