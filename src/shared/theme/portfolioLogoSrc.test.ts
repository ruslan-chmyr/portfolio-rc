import { describe, expect, it } from 'vitest'
import { chromeLogoSrc, portfolioLogoSrc } from './portfolioLogoSrc'

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

describe('chromeLogoSrc', () => {
  it('keeps a white mark on immersive dark scenes regardless of theme', () => {
    expect(chromeLogoSrc('light', 'immersive', assets)).toBe('logo-white.svg')
    expect(chromeLogoSrc('dark', 'immersive', assets)).toBe('logo-white.svg')
  })

  it('follows inverted portfolio luminance', () => {
    expect(chromeLogoSrc('light', 'portfolio', assets)).toBe('logo-white.svg')
    expect(chromeLogoSrc('dark', 'portfolio', assets)).toBe('logo-dark.svg')
  })

  it('follows intro page luminance from the theme name', () => {
    expect(chromeLogoSrc('light', 'intro', assets)).toBe('logo-dark.svg')
    expect(chromeLogoSrc('dark', 'intro', assets)).toBe('logo-white.svg')
  })
})
