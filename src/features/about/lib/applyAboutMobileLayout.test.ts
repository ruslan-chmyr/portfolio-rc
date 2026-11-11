// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('gsap', () => ({
  default: {
    set: vi.fn(),
  },
}))

import { applyAboutMobileLayout } from './applyAboutMobileLayout'
import { applyAboutReducedMotion } from './applyAboutReducedMotion'
import { isAboutMobileViewport } from './selectAboutPresentationMode'

describe('applyAboutMobileLayout', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('applies mobile classes without coupling to static reduced-motion mode', () => {
    const section = document.createElement('section')
    const content = document.createElement('article')
    const word = document.createElement('div')
    section.append(content, word)
    document.body.append(section)

    applyAboutMobileLayout(section, [word], content)

    expect(section.classList.contains('about-section--mobile')).toBe(true)
    expect(section.classList.contains('about-section--type-ready')).toBe(true)
    expect(section.classList.contains('about-section--static')).toBe(false)
    expect(section.classList.contains('about-section--motion-reduced')).toBe(false)
  })

  it('marks motion-reduced separately when requested on mobile', () => {
    const section = document.createElement('section')
    const content = document.createElement('article')
    const word = document.createElement('div')
    section.append(content, word)

    applyAboutMobileLayout(section, [word], content, { prefersReducedMotion: true })

    expect(section.classList.contains('about-section--mobile')).toBe(true)
    expect(section.classList.contains('about-section--motion-reduced')).toBe(true)
    expect(section.classList.contains('about-section--static')).toBe(false)
  })
})

describe('applyAboutReducedMotion', () => {
  it('uses static desktop presentation without mobile class', () => {
    const section = document.createElement('section')
    section.classList.add('about-section--mobile')
    const content = document.createElement('article')
    const word = document.createElement('div')
    section.append(content, word)

    applyAboutReducedMotion(section, [word], content)

    expect(section.classList.contains('about-section--static')).toBe(true)
    expect(section.classList.contains('about-section--type-ready')).toBe(true)
    expect(section.classList.contains('about-section--mobile')).toBe(false)
  })
})

describe('isAboutMobileViewport', () => {
  it('keeps the 700px breakpoint', () => {
    expect(isAboutMobileViewport(700)).toBe(true)
    expect(isAboutMobileViewport(701)).toBe(false)
  })
})
