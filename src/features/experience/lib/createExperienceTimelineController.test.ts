// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fromTo, matchMediaAdd, matchMediaRevert, contextRevert } = vi.hoisted(
  () => ({
    fromTo: vi.fn(),
    matchMediaAdd: vi.fn(),
    matchMediaRevert: vi.fn(),
    contextRevert: vi.fn(),
  }),
)

vi.mock('gsap', () => {
  const context = vi.fn((fn: () => void) => {
    fn()
    return { revert: contextRevert }
  })
  const matchMedia = vi.fn(() => ({
    add: matchMediaAdd,
    revert: matchMediaRevert,
  }))
  return {
    default: {
      registerPlugin: vi.fn(),
      set: vi.fn(),
      getProperty: vi.fn(() => 0),
      fromTo,
      context,
      matchMedia,
    },
  }
})

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
    create: vi.fn(),
  },
}))

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  applyExperienceStaticPresentation,
  createExperienceTimelineController,
} from './createExperienceTimelineController'

function mountTimelineDom(options?: { withIntro?: boolean; withEndpoint?: boolean }) {
  const withIntro = options?.withIntro ?? true
  const withEndpoint = options?.withEndpoint ?? true
  const section = document.createElement('section')
  section.id = 'experience'
  section.innerHTML = `
    <div class="experience-timeline">
      <aside class="experience-timeline__sidebar">
        ${
          withIntro
            ? `<div class="experience-timeline__sidebar-sticky">
          <p class="experience-timeline__year">2026</p>
          <div class="experience-cv-cta" data-experience-cta>
            <a class="experience-cv-cta__button" href="https://cdn.example.com/cv.pdf">View Full CV</a>
          </div>
        </div>`
            : `<p class="experience-timeline__year">2026</p>
               <div class="experience-cv-cta" data-experience-cta>
                 <a class="experience-cv-cta__button" href="https://cdn.example.com/cv.pdf">View Full CV</a>
               </div>`
        }
      </aside>
      <div class="experience-timeline__track" style="height: 1000px">
        <div class="experience-timeline__progress"></div>
        <span data-experience-node style="position:relative;top:100px;height:12px;display:block"></span>
        <span data-experience-node style="position:relative;top:300px;height:12px;display:block"></span>
        <span data-experience-node style="position:relative;top:500px;height:12px;display:block"></span>
        <span data-experience-node style="position:relative;top:700px;height:12px;display:block"></span>
        ${
          withEndpoint
            ? '<span data-experience-node data-experience-endpoint-node style="position:relative;top:900px;height:12px;display:block"></span>'
            : ''
        }
        <article data-experience-card></article>
        <article data-experience-card></article>
        <article data-experience-card></article>
        <article data-experience-card></article>
      </div>
    </div>
  `
  document.body.append(section)
  const track = section.querySelector<HTMLElement>('.experience-timeline__track')!
  const progress = section.querySelector<HTMLElement>(
    '.experience-timeline__progress',
  )!
  const year = section.querySelector<HTMLElement>('.experience-timeline__year')!
  const nodes = Array.from(
    section.querySelectorAll<HTMLElement>('[data-experience-node]'),
  )
  const cards = Array.from(
    section.querySelectorAll<HTMLElement>('[data-experience-card]'),
  )
  const intro = section.querySelector<HTMLElement>(
    '.experience-timeline__sidebar-sticky',
  )
  const cta = section.querySelector<HTMLElement>('[data-experience-cta]')!
  return { section, track, progress, year, nodes, cards, intro, cta }
}

function lastFromToVars() {
  const vars = fromTo.mock.calls.at(-1)?.[2] as {
    onUpdate?: (this: { progress: () => number }) => void
    scrollTrigger?: {
      scrub?: number
      onRefresh?: () => void
    }
  }
  return vars
}

function runTweenProgress(value: number) {
  const vars = lastFromToVars()
  expect(vars.onUpdate).toBeTypeOf('function')
  vars.onUpdate!.call({ progress: () => value })
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
    matchMediaAdd.mockImplementation((_query: string, fn: () => void) => {
      fn()
      return () => undefined
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return (this as HTMLElement).classList.contains(
          'experience-timeline__sidebar-sticky',
        )
          ? 280
          : 1000
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        return 0
      },
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function mockRect(this: HTMLElement) {
        if (this.matches('[data-experience-node]')) {
          const nodes = Array.from(
            this.ownerDocument.querySelectorAll('[data-experience-node]'),
          )
          const index = nodes.indexOf(this)
          const tops = [100, 300, 500, 700, 900]
          const top = tops[index] ?? 0
          return {
            top,
            bottom: top + 12,
            left: 0,
            right: 12,
            width: 12,
            height: 12,
            x: 0,
            y: top,
            toJSON() {
              return {}
            },
          } as DOMRect
        }
        if (this.classList.contains('experience-timeline__track')) {
          return {
            top: 0,
            bottom: 1000,
            left: 0,
            right: 400,
            width: 400,
            height: 1000,
            x: 0,
            y: 0,
            toJSON() {
              return {}
            },
          } as DOMRect
        }
        return {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON() {
            return {}
          },
        } as DOMRect
      },
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('creates a scrubbed progress tween synced to animated progress', () => {
    const dom = mountTimelineDom()
    const controller = createExperienceTimelineController(
      {
        ...dom,
        years: ['2026', '2023', '2020', '2019'],
      },
      { prefersReducedMotion: false },
    )

    expect(dom.section.dataset.experienceMotion).toBe('scroll')
    expect(fromTo).toHaveBeenCalled()
    const vars = lastFromToVars()
    expect(vars.scrollTrigger?.scrub).toBeTypeOf('number')
    expect(vars.onUpdate).toBeTypeOf('function')
    expect(vars.scrollTrigger?.onRefresh).toBeTypeOf('function')
    expect(ScrollTrigger.refresh).toHaveBeenCalled()

    controller.dispose()
    expect(dom.section.dataset.experienceMotion).toBeUndefined()
    expect(contextRevert).toHaveBeenCalled()
  })

  it('keeps milestones on the tween update path during scrub settle', () => {
    const dom = mountTimelineDom()
    createExperienceTimelineController(
      {
        ...dom,
        years: ['2026', '2023', '2020', '2019'],
      },
      { prefersReducedMotion: false },
    )

    // Scrub still catching up — only the tween progress may advance.
    runTweenProgress(0.01)
    expect(dom.nodes.every((node) => !node.classList.contains('is-active'))).toBe(
      true,
    )
    runTweenProgress(0.35)
    expect(dom.nodes[1]?.classList.contains('is-active')).toBe(true)
    expect(dom.year.textContent).toBe('2023')
  })

  it('activates milestones from animated tween progress, including reverse and CTA endpoint', () => {
    const dom = mountTimelineDom()
    createExperienceTimelineController(
      {
        ...dom,
        years: ['2026', '2023', '2020', '2019'],
      },
      { prefersReducedMotion: false },
    )

    // Below first threshold (~0.08)
    runTweenProgress(0.01)
    expect(dom.nodes.every((node) => !node.classList.contains('is-active'))).toBe(
      true,
    )
    expect(dom.cta.classList.contains('is-active')).toBe(false)
    expect(dom.cta.hasAttribute('inert')).toBe(true)

    // Fast-forward past second career node
    runTweenProgress(0.35)
    expect(dom.nodes[0]?.classList.contains('is-active')).toBe(true)
    expect(dom.nodes[1]?.classList.contains('is-active')).toBe(true)
    expect(dom.cards[1]?.classList.contains('is-active')).toBe(true)
    expect(dom.year.textContent).toBe('2023')
    expect(dom.cta.classList.contains('is-active')).toBe(false)

    // Final career node
    runTweenProgress(0.72)
    expect(dom.nodes[3]?.classList.contains('is-active')).toBe(true)
    expect(dom.cta.classList.contains('is-active')).toBe(false)

    // Endpoint illuminates CTA
    runTweenProgress(0.95)
    expect(dom.nodes[4]?.classList.contains('is-active')).toBe(true)
    expect(dom.cta.classList.contains('is-active')).toBe(true)
    expect(dom.cta.hasAttribute('inert')).toBe(false)
    expect(dom.year.textContent).toBe('2019')

    // Reverse deactivates endpoint first
    runTweenProgress(0.72)
    expect(dom.nodes[4]?.classList.contains('is-active')).toBe(false)
    expect(dom.cta.classList.contains('is-active')).toBe(false)
    expect(dom.cta.hasAttribute('inert')).toBe(true)
    expect(dom.nodes[3]?.classList.contains('is-active')).toBe(true)
  })

  it('registers a desktop pin via matchMedia and cleans up through context', () => {
    const dom = mountTimelineDom({ withIntro: true })
    const controller = createExperienceTimelineController(
      {
        ...dom,
        years: ['2026', '2023', '2020', '2019'],
      },
      { prefersReducedMotion: false },
    )

    expect(gsap.matchMedia).toHaveBeenCalled()
    expect(matchMediaAdd).toHaveBeenCalled()
    const query = matchMediaAdd.mock.calls[0]?.[0] as string
    expect(query).toContain('min-width')
    expect(query).toContain('961')
    expect(ScrollTrigger.create).toHaveBeenCalled()
    const pinVars = (ScrollTrigger.create as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as { pin?: HTMLElement; pinSpacing?: boolean }
    expect(pinVars.pin).toBe(dom.intro)
    expect(pinVars.pinSpacing).toBe(false)

    controller.dispose()
    expect(contextRevert).toHaveBeenCalled()
  })

  it('does not create a pin when intro is missing', () => {
    const dom = mountTimelineDom({ withIntro: false })
    matchMediaAdd.mockImplementation((_query: string, fn: () => void) => {
      fn()
      return () => undefined
    })
    createExperienceTimelineController(
      {
        section: dom.section,
        track: dom.track,
        progress: dom.progress,
        year: dom.year,
        nodes: dom.nodes,
        cards: dom.cards,
        years: ['2026', '2023', '2020', '2019'],
        intro: null,
      },
      { prefersReducedMotion: false },
    )

    expect(ScrollTrigger.create).not.toHaveBeenCalled()
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
    expect(dom.cta.classList.contains('is-active')).toBe(true)
    expect(dom.cta.hasAttribute('inert')).toBe(false)

    controller.dispose()
    expect(dom.cta.classList.contains('is-active')).toBe(false)
  })

  it('applyExperienceStaticPresentation covers unready/error fail-open', () => {
    const dom = mountTimelineDom()
    applyExperienceStaticPresentation(
      {
        section: dom.section,
        progress: dom.progress,
        year: dom.year,
        nodes: dom.nodes,
        cards: dom.cards,
        years: ['2026', '2023', '2020', '2019'],
      },
      'error',
    )
    expect(dom.section.dataset.experienceMotion).toBe('error')
    expect(dom.cards.every((card) => card.classList.contains('is-active'))).toBe(
      true,
    )
    expect(dom.cta.classList.contains('is-active')).toBe(true)
    expect(dom.cta.hasAttribute('inert')).toBe(false)
  })
})
