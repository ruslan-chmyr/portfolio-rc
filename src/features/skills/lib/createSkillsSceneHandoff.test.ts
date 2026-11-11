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

import { createSkillsSceneHandoff } from './createSkillsSceneHandoff'

describe('createSkillsSceneHandoff scheduling', () => {
  let rafCbs: FrameRequestCallback[]
  let rafId: number

  beforeEach(() => {
    rafCbs = []
    rafId = 0
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCbs.push(cb)
        rafId += 1
        return rafId
      }),
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => {
        void id
      }),
    )
    vi.stubGlobal(
      'scrollTo',
      vi.fn((..._args: unknown[]) => undefined),
    )
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('schedules a one-shot eval frame on mount and cancels pending work on dispose', () => {
    const section = document.createElement('section')
    section.className = 'skills-section'
    document.body.append(section)
    section.getBoundingClientRect = () =>
      ({
        top: 800,
        left: 0,
        width: 100,
        height: 700,
        bottom: 1500,
        right: 100,
        x: 0,
        y: 800,
        toJSON: () => ({}),
      }) as DOMRect

    const handoff = createSkillsSceneHandoff({
      section,
      enabled: true,
    })

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    expect(rafCbs).toHaveLength(1)

    // Dispose before the mount frame runs — pending eval must be canceled.
    handoff.dispose()
    expect(cancelAnimationFrame).toHaveBeenCalled()
    expect(section.dataset.skillsHandoff).toBeUndefined()
  })

  it('does not chain a perpetual rAF after the mount sync frame', () => {
    const section = document.createElement('section')
    section.className = 'skills-section'
    document.body.append(section)
    section.getBoundingClientRect = () =>
      ({
        top: 800,
        left: 0,
        width: 100,
        height: 700,
        bottom: 1500,
        right: 100,
        x: 0,
        y: 800,
        toJSON: () => ({}),
      }) as DOMRect

    const handoff = createSkillsSceneHandoff({
      section,
      enabled: true,
    })

    const before = rafCbs.length
    rafCbs[0]?.(0)
    expect(rafCbs.length).toBe(before)

    handoff.dispose()
  })

  it('coalesces scroll evaluations into a single pending rAF', () => {
    const section = document.createElement('section')
    section.className = 'skills-section'
    document.body.append(section)
    section.getBoundingClientRect = () =>
      ({
        top: 400,
        left: 0,
        width: 100,
        height: 700,
        bottom: 1100,
        right: 100,
        x: 0,
        y: 400,
        toJSON: () => ({}),
      }) as DOMRect

    const handoff = createSkillsSceneHandoff({
      section,
      enabled: true,
    })
    // Consume mount frame.
    rafCbs.shift()?.(0)
    const callsAfterMount = vi.mocked(requestAnimationFrame).mock.calls.length

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 40 })
    window.dispatchEvent(new Event('scroll'))
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 80 })
    window.dispatchEvent(new Event('scroll'))

    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBe(
      callsAfterMount + 1,
    )

    handoff.dispose()
  })
})
