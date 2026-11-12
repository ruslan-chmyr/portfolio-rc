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

  it('returns rail for desktop Skills, Projects, Experience, and Contact', () => {
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'expertise',
        viewportWidth: 1440,
      }),
    ).toBe('rail')
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'projects',
        viewportWidth: 1440,
      }),
    ).toBe('rail')
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'experience',
        viewportWidth: 1440,
      }),
    ).toBe('rail')
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'contact',
        viewportWidth: 1440,
      }),
    ).toBe('rail')
  })

  it('keeps About on standard desktop chrome', () => {
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'about',
        viewportWidth: 1440,
      }),
    ).toBe('standard')
  })

  it('returns compact for narrow viewports', () => {
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'expertise',
        viewportWidth: 700,
      }),
    ).toBe('compact')
    expect(
      resolvePortfolioNavMode({
        nativeScroll: true,
        activeSection: 'projects',
        viewportWidth: 700,
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
