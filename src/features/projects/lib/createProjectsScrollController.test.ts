// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const timelineApi = {
  fromTo: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  scrollTrigger: { progress: 0, update: vi.fn() },
}

vi.mock('gsap', () => {
  const set = vi.fn()
  const timeline = vi.fn(() => timelineApi)
  const context = vi.fn((fn: () => void) => {
    fn()
    return { revert: vi.fn() }
  })
  return {
    default: {
      registerPlugin: vi.fn(),
      set,
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

import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createProjectsScrollController } from './createProjectsScrollController'

function mountProjectsDom() {
  const section = document.createElement('section')
  section.className = 'projects-section'
  section.id = 'projects'
  section.setAttribute('aria-label', 'Selected Projects')
  section.innerHTML = `
    <div class="projects-section__pin">
      <div class="projects-section__panel"></div>
    </div>
  `
  document.body.append(section)
  const pin = section.querySelector<HTMLElement>('.projects-section__pin')!
  const panel = section.querySelector<HTMLElement>('.projects-section__panel')!
  return { section, pin, panel }
}

describe('createProjectsScrollController', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
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

  it('builds a scrubbed timeline and cleans up on dispose', () => {
    const { section, pin, panel } = mountProjectsDom()
    const controller = createProjectsScrollController({ section, pin, panel })

    expect(section.dataset.projectsMotion).toBe('scroll')
    expect(timelineApi.fromTo).toHaveBeenCalled()
    expect(ScrollTrigger.refresh).toHaveBeenCalled()

    controller.dispose()
    expect(section.dataset.projectsMotion).toBeUndefined()
    expect(panel.style.willChange).toBe('')
  })

  it('refreshes ScrollTrigger after portfolio scroll handoff', () => {
    const { section, pin, panel } = mountProjectsDom()
    const controller = createProjectsScrollController({ section, pin, panel })
    const refreshCount = vi.mocked(ScrollTrigger.refresh).mock.calls.length

    window.dispatchEvent(new CustomEvent('portfolio-scroll-handoff'))
    expect(vi.mocked(ScrollTrigger.refresh).mock.calls.length).toBeGreaterThan(
      refreshCount,
    )

    controller.dispose()
  })

  it('clears the projects scene marker on dispose', () => {
    const { section, pin, panel } = mountProjectsDom()
    document.documentElement.dataset.projectsScene = 'active'
    const controller = createProjectsScrollController({ section, pin, panel })
    controller.dispose()
    expect(document.documentElement.dataset.projectsScene).toBeUndefined()
  })
})
