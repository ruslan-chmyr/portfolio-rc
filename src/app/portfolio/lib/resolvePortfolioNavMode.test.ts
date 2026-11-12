import { describe, expect, it } from 'vitest'
import {
  portfolioChromeSurface,
  resolvePortfolioNavMode,
} from './resolvePortfolioNavMode'

describe('resolvePortfolioNavMode', () => {
  it('returns intro while native scroll is inactive', () => {
    expect(
      resolvePortfolioNavMode({
        nativeScroll: false,
        activeSection: 'about',
        viewportWidth: 1440,
      }),
    ).toBe('intro')
  })

  it('returns standard for desktop portfolio sections', () => {
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'about',
        viewportWidth: 1440,
      }),
    ).toBe('standard')
  })

  it('returns compact for immersive scenes and narrow viewports', () => {
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'projects',
        viewportWidth: 1440,
      }),
    ).toBe('compact')
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'about',
        viewportWidth: 700,
      }),
    ).toBe('compact')
  })
})

describe('portfolioChromeSurface', () => {
  it('maps immersive vs portfolio surfaces', () => {
    expect(portfolioChromeSurface('intro')).toBe('intro')
    expect(portfolioChromeSurface('about')).toBe('portfolio')
    expect(portfolioChromeSurface('expertise')).toBe('immersive')
    expect(portfolioChromeSurface('projects')).toBe('immersive')
  })
})
