// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: () => [],
  },
}))

vi.mock('../../../shared/scene/portfolioScene', () => ({
  isProjectsSceneActive: () => false,
}))

import {
  endPortfolioNavSession,
  isPortfolioNavSessionActive,
} from './portfolioNavSession'
import {
  navigatePortfolioSection,
  PORTFOLIO_NAVIGATE_EVENT,
} from './navigatePortfolioSection'

describe('navigatePortfolioSection', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.body.innerHTML = ''
    endPortfolioNavSession()
    // Do not invoke the callback synchronously — the settle watcher would
    // otherwise recurse until "stable" and clear the session under test.
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
  })

  afterEach(() => {
    endPortfolioNavSession()
    vi.unstubAllGlobals()
  })

  it('refuses navigation while intro owns the viewport without announcing', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const onNavigate = vi.fn()
    window.addEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)

    expect(navigatePortfolioSection('contact')).toBe(false)
    expect(scrollTo).not.toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
    expect(isPortfolioNavSessionActive()).toBe(false)

    window.removeEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)
  })

  it('does not announce or mutate state for missing destinations', () => {
    document.documentElement.classList.add('portfolio-native-scroll')
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const onNavigate = vi.fn()
    window.addEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)

    expect(navigatePortfolioSection('contact')).toBe(false)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(scrollTo).not.toHaveBeenCalled()
    expect(isPortfolioNavSessionActive()).toBe(false)

    window.removeEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)
  })

  it('announces only after validation and scrolls to contact', () => {
    document.documentElement.classList.add('portfolio-native-scroll')
    document.body.innerHTML = '<section id="contact"></section>'
    const contact = document.getElementById('contact')!
    vi.spyOn(contact, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      bottom: 900,
      left: 0,
      right: 0,
      width: 0,
      height: 400,
      x: 0,
      y: 500,
      toJSON: () => ({}),
    })
    Object.defineProperty(window, 'scrollY', {
      value: 200,
      configurable: true,
      writable: true,
    })
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const onNavigate = vi.fn()
    window.addEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)

    expect(navigatePortfolioSection('contact')).toBe(true)
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 700, left: 0 }),
    )
    expect(isPortfolioNavSessionActive()).toBe(true)

    window.removeEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)
  })

  it('supports reverse navigation back to about', () => {
    document.documentElement.classList.add('portfolio-native-scroll')
    document.body.innerHTML =
      '<section class="about-section"></section><section id="contact"></section>'
    Object.defineProperty(window, 'scrollY', {
      value: 3000,
      configurable: true,
      writable: true,
    })
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    expect(navigatePortfolioSection('about')).toBe(true)
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0, left: 0 }),
    )
  })
})
