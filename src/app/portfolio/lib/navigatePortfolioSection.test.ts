// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: () => [],
  },
}))

vi.mock('../../../shared/scene/portfolioScene', () => ({
  isProjectsSceneActive: () => false,
}))

import {
  navigatePortfolioSection,
  PORTFOLIO_NAVIGATE_EVENT,
} from './navigatePortfolioSection'

describe('navigatePortfolioSection', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('refuses navigation while intro owns the viewport', () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    expect(navigatePortfolioSection('contact')).toBe(false)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('announces navigation and scrolls to contact after handoff', () => {
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
    Object.defineProperty(window, 'scrollY', { value: 200, configurable: true })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const onNavigate = vi.fn()
    window.addEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)

    expect(navigatePortfolioSection('contact')).toBe(true)
    expect(onNavigate).toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 700, left: 0 }),
    )

    window.removeEventListener(PORTFOLIO_NAVIGATE_EVENT, onNavigate)
  })
})
