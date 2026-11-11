// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('gsap', () => {
  const set = vi.fn()
  const timeline = vi.fn(() => {
    const tl = {
      to: vi.fn().mockReturnThis(),
      progress: vi.fn().mockReturnValue(0),
      invalidate: vi.fn().mockReturnThis(),
      scrollTrigger: { progress: 0, update: vi.fn() },
    }
    return tl
  })
  const context = vi.fn((_fn: () => void, _scope?: Element) => {
    _fn()
    return { revert: vi.fn() }
  })
  return {
    default: {
      registerPlugin: vi.fn(),
      set,
      getProperty: vi.fn(() => 1),
      context,
      timeline,
    },
  }
})

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
  },
}))

vi.mock('./buildAboutScrollTimeline', () => ({
  buildAboutScrollTimeline: vi.fn(),
  setAboutScrollInitialStates: vi.fn(),
}))

vi.mock('./syncTypeClusterLayout', () => ({
  syncTypeClusterLayout: vi.fn(),
}))

import { createAboutScrollController } from './createAboutScrollController'

function mountAboutDom() {
  const section = document.createElement('section')
  section.className = 'about-section'
  section.innerHTML = `
    <div class="about-section__pin">
      <div class="about-hero-type__stage"></div>
      <div class="about-hero-type__word" data-word="senior"></div>
      <div class="about-hero-type__word" data-word="frontend"></div>
      <div class="about-hero-type__word" data-word="engineer"></div>
      <article class="about-content"><div class="about-content__reveal"></div></article>
      <div class="about-section__index-column"></div>
      <div class="about-tech-ambient__reveal"></div>
    </div>
  `
  document.body.append(section)
  const pin = section.querySelector<HTMLElement>('.about-section__pin')!
  const stage = section.querySelector<HTMLDivElement>('.about-hero-type__stage')!
  const [senior, frontend, engineer] = section.querySelectorAll<HTMLElement>(
    '.about-hero-type__word',
  )
  const content = section.querySelector<HTMLElement>('.about-content')!
  return { section, pin, stage, senior, frontend, engineer, content }
}

describe('createAboutScrollController dispose', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('cancels a pending relayout frame and ignores late callbacks after dispose', () => {
    const rafIds: number[] = []
    let rafCb: FrameRequestCallback | null = null
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCb = cb
        const id = rafIds.length + 1
        rafIds.push(id)
        return id
      }),
    )
    const cancelSpy = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancelSpy)

    const els = mountAboutDom()
    const controller = createAboutScrollController(els)

    window.dispatchEvent(new CustomEvent('portfolio-scroll-handoff'))
    expect(rafIds.length).toBe(1)

    controller.dispose()
    expect(cancelSpy).toHaveBeenCalledWith(1)

    // Late frame must not throw or re-enter layout work.
    expect(() => rafCb?.(0)).not.toThrow()
  })

  it('is safe to dispose more than once', () => {
    const els = mountAboutDom()
    const controller = createAboutScrollController(els)
    expect(() => {
      controller.dispose()
      controller.dispose()
    }).not.toThrow()
  })
})
