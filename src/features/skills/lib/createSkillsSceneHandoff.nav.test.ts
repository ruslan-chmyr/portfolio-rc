// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    set: vi.fn(),
    to: vi.fn(() => ({ kill: vi.fn() })),
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: vi.fn(() => []),
  },
}))

import {
  beginPortfolioNavSession,
  endPortfolioNavSession,
  isPortfolioNavSessionActive,
} from '../../../app/portfolio/lib/portfolioNavSession'
import { PORTFOLIO_NAVIGATE_EVENT } from '../../../app/portfolio/lib/navigatePortfolioSection'
import { createSkillsSceneHandoff } from './createSkillsSceneHandoff'

describe('skills handoff ↔ portfolio navigation coordination', () => {
  let rafCbs: FrameRequestCallback[]

  beforeEach(() => {
    rafCbs = []
    endPortfolioNavSession()
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCbs.push(cb)
        return rafCbs.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal(
      'scrollTo',
      vi.fn((..._args: unknown[]) => undefined),
    )
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })
  })

  afterEach(() => {
    endPortfolioNavSession()
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  function mountHandoff() {
    const section = document.createElement('section')
    section.id = 'expertise'
    section.className = 'skills-section'
    document.body.append(section)
    section.getBoundingClientRect = () =>
      ({
        top: 180,
        left: 0,
        width: 100,
        height: 700,
        bottom: 880,
        right: 100,
        x: 0,
        y: 180,
        toJSON: () => ({}),
      }) as DOMRect

    const handoff = createSkillsSceneHandoff({
      section,
      enabled: true,
    })
    // Consume mount frame.
    rafCbs.shift()?.(0)
    return { section, handoff }
  }

  it('yields phase updates from navigate events and kills competing aligns', () => {
    const { section, handoff } = mountHandoff()
    expect(handoff.getPhase()).toBe('idle')

    window.dispatchEvent(
      new CustomEvent(PORTFOLIO_NAVIGATE_EVENT, {
        detail: { sectionId: 'contact' },
      }),
    )
    expect(handoff.getPhase()).toBe('passed')
    expect(section.dataset.skillsHandoff).toBe('passed')

    window.dispatchEvent(
      new CustomEvent(PORTFOLIO_NAVIGATE_EVENT, {
        detail: { sectionId: 'about' },
      }),
    )
    expect(handoff.getPhase()).toBe('idle')

    handoff.dispose()
  })

  it('does not begin Skills align while a portfolio nav session owns scroll', () => {
    const { section, handoff } = mountHandoff()
    beginPortfolioNavSession('contact', 4000)

    const before = handoff.getPhase()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 })
    window.dispatchEvent(new Event('scroll'))
    rafCbs.shift()?.(0)

    expect(handoff.getPhase()).toBe(before)
    expect(section.dataset.skillsHandoff).toBe(before)

    endPortfolioNavSession()
    handoff.dispose()
  })

  it('clears nav session ownership on user wheel interrupt', () => {
    const { handoff } = mountHandoff()
    beginPortfolioNavSession('contact', 4000)
    expect(isPortfolioNavSessionActive()).toBe(true)

    window.dispatchEvent(new Event('wheel', { bubbles: true }))
    expect(isPortfolioNavSessionActive()).toBe(false)

    handoff.dispose()
  })
})
