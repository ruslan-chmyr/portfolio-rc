// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { timeline, set, context } = vi.hoisted(() => {
  const timeline = vi.fn(() => {
    const api = {
      to: vi.fn(function to(this: unknown) {
        return this
      }),
    }
    return api
  })
  return {
    timeline,
    set: vi.fn(),
    context: vi.fn((fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    }),
  }
})

vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    set,
    timeline,
    context,
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
  },
}))

import { createContactEntranceController } from './createContactEntranceController'

function mount() {
  const section = document.createElement('section')
  section.id = 'contact'
  section.innerHTML = `
    <div data-intro></div>
    <div data-links></div>
    <div data-form></div>
    <div data-footer></div>
  `
  document.body.append(section)
  return {
    section,
    intro: section.querySelector<HTMLElement>('[data-intro]')!,
    links: section.querySelector<HTMLElement>('[data-links]')!,
    form: section.querySelector<HTMLElement>('[data-form]')!,
    footer: section.querySelector<HTMLElement>('[data-footer]')!,
  }
}

describe('createContactEntranceController', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        cb(0)
        return 1
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('builds a one-shot entrance timeline', () => {
    const dom = mount()
    const controller = createContactEntranceController(dom, {
      prefersReducedMotion: false,
    })
    expect(dom.section.dataset.contactMotion).toBe('scroll')
    expect(timeline).toHaveBeenCalled()
    controller.dispose()
    expect(dom.section.dataset.contactMotion).toBeUndefined()
  })

  it('skips motion under reduced-motion preferences', () => {
    const dom = mount()
    const controller = createContactEntranceController(dom, {
      prefersReducedMotion: true,
    })
    expect(dom.section.dataset.contactMotion).toBe('static')
    expect(timeline).not.toHaveBeenCalled()
    controller.dispose()
  })
})
