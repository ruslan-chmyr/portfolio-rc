// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fromTo } = vi.hoisted(() => ({
  fromTo: vi.fn(),
}))

vi.mock('gsap', () => {
  const context = vi.fn((fn: () => void) => {
    fn()
    return { revert: vi.fn() }
  })
  return {
    default: {
      registerPlugin: vi.fn(),
      set: vi.fn(),
      fromTo,
      context,
    },
  }
})

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
  },
}))

import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createExperienceTimelineController } from './createExperienceTimelineController'

function mountTimelineDom() {
  const section = document.createElement('section')
  section.id = 'experience'
  section.innerHTML = `
    <div class="experience-timeline">
      <p class="experience-timeline__year">2026</p>
      <div class="experience-timeline__track" style="height: 900px">
        <div class="experience-timeline__progress"></div>
        <span data-experience-node style="position:relative;top:100px;height:12px;display:block"></span>
        <span data-experience-node style="position:relative;top:350px;height:12px;display:block"></span>
        <span data-experience-node style="position:relative;top:600px;height:12px;display:block"></span>
        <span data-experience-node style="position:relative;top:800px;height:12px;display:block"></span>
        <article data-experience-card></article>
        <article data-experience-card></article>
        <article data-experience-card></article>
        <article data-experience-card></article>
      </div>
    </div>
  `
  document.body.append(section)
  const track = section.querySelector<HTMLElement>('.experience-timeline__track')!
  const progress = section.querySelector<HTMLElement>('.experience-timeline__progress')!
  const year = section.querySelector<HTMLElement>('.experience-timeline__year')!
  const nodes = Array.from(section.querySelectorAll<HTMLElement>('[data-experience-node]'))
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-experience-card]'))
  return { section, track, progress, year, nodes, cards }
}

describe('createExperienceTimelineController', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        cb(0)
        return 1
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return 900
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        const el = this as HTMLElement
        if (el.matches('[data-experience-node]')) {
          const nodes = Array.from(
            el.ownerDocument.querySelectorAll('[data-experience-node]'),
          )
          const index = nodes.indexOf(el)
          return [100, 350, 600, 800][index] ?? 0
        }
        return 0
      },
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('creates a scrubbed progress tween and cleans up', () => {
    const dom = mountTimelineDom()
    const controller = createExperienceTimelineController(
      {
        ...dom,
        years: ['2026', '2023', '2020', '2019'],
      },
      { prefersReducedMotion: false },
    )

    expect(dom.section.dataset.experienceMotion).toBe('scroll')
    expect(dom.nodes).toHaveLength(4)
    expect(dom.cards).toHaveLength(4)
    expect(fromTo).toHaveBeenCalled()
    const vars = fromTo.mock.calls[0]?.[2] as {
      scrollTrigger?: { scrub?: number }
    }
    expect(vars.scrollTrigger?.scrub).toBeTypeOf('number')
    expect(ScrollTrigger.refresh).toHaveBeenCalled()

    controller.dispose()
    expect(dom.section.dataset.experienceMotion).toBeUndefined()
  })

  it('shows a static fully-active timeline under reduced motion', () => {
    const dom = mountTimelineDom()
    const controller = createExperienceTimelineController(
      {
        ...dom,
        years: ['2026', '2023', '2020', '2019'],
      },
      { prefersReducedMotion: true },
    )

    expect(dom.section.dataset.experienceMotion).toBe('static')
    expect(fromTo).not.toHaveBeenCalled()
    expect(dom.nodes.every((node) => node.classList.contains('is-active'))).toBe(
      true,
    )
    expect(dom.cards.every((card) => card.classList.contains('is-active'))).toBe(
      true,
    )

    controller.dispose()
  })
})
