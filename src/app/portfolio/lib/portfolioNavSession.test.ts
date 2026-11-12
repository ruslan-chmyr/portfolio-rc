// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  beginPortfolioNavSession,
  endPortfolioNavSession,
  getPortfolioNavSession,
  isPortfolioNavSessionActive,
  PORTFOLIO_NAV_DATASET_KEY,
} from './portfolioNavSession'

describe('portfolioNavSession', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    delete document.documentElement.dataset[PORTFOLIO_NAV_DATASET_KEY]
    endPortfolioNavSession()
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    endPortfolioNavSession()
    vi.unstubAllGlobals()
  })

  it('marks ownership on begin and clears on end', () => {
    beginPortfolioNavSession('contact', 1200)
    expect(isPortfolioNavSessionActive()).toBe(true)
    expect(getPortfolioNavSession()).toEqual({
      sectionId: 'contact',
      targetY: 1200,
    })
    expect(document.documentElement.dataset[PORTFOLIO_NAV_DATASET_KEY]).toBe(
      'contact',
    )

    endPortfolioNavSession()
    expect(isPortfolioNavSessionActive()).toBe(false)
    expect(document.documentElement.dataset[PORTFOLIO_NAV_DATASET_KEY]).toBe(
      undefined,
    )
  })

  it('replaces a previous session instead of stacking owners', () => {
    beginPortfolioNavSession('about', 0)
    beginPortfolioNavSession('contact', 2400)
    expect(getPortfolioNavSession()?.sectionId).toBe('contact')
    expect(document.documentElement.dataset[PORTFOLIO_NAV_DATASET_KEY]).toBe(
      'contact',
    )
  })

  it('ends on user wheel interrupt', () => {
    beginPortfolioNavSession('experience', 1800)
    window.dispatchEvent(new Event('wheel', { bubbles: true }))
    expect(isPortfolioNavSessionActive()).toBe(false)
  })
})
