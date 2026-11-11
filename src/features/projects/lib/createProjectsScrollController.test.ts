// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const timelineApi = {
  fromTo: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  scrollTrigger: { progress: 0, update: vi.fn() },
}

const gsapSet = vi.fn()

vi.mock('gsap', () => {
  const timeline = vi.fn(() => timelineApi)
  const context = vi.fn((fn: () => void) => {
    fn()
    return { revert: vi.fn() }
  })
  return {
    default: {
      registerPlugin: vi.fn(),
      set: (...args: unknown[]) => gsapSet(...args),
      context,
      timeline,
    },
  }
})

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
    create: vi.fn(() => ({ kill: vi.fn() })),
  },
}))

import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createProjectsScrollController } from './createProjectsScrollController'

function mountProjectsDom(options?: { withSkills?: boolean; withExperience?: boolean }) {
  if (options?.withSkills) {
    const skills = document.createElement('section')
    skills.id = 'expertise'
    skills.dataset.skillsEntrance = 'pending'
    skills.innerHTML = `
      <div class="skills-section__shell">
        <div class="skills-section__keyboard-panel"></div>
        <aside class="skills-section__stories-panel"></aside>
      </div>
    `
    document.body.append(skills)
  }

  if (options?.withExperience) {
    const experience = document.createElement('section')
    experience.id = 'experience'
    experience.className = 'experience-section'
    experience.innerHTML = `<div class="experience-section__motion"></div>`
    document.body.append(experience)
  }

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
    delete document.documentElement.dataset.projectsScene
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

  it('does not force Skills fade targets visible on init', () => {
    const { section, pin, panel } = mountProjectsDom({ withSkills: true })
    createProjectsScrollController({ section, pin, panel }).dispose()

    const forcedVisible = gsapSet.mock.calls.some((call) => {
      const target = call[0]
      const vars = call[1] as { autoAlpha?: number } | undefined
      if (!vars || vars.autoAlpha !== 1) return false
      if (target instanceof HTMLElement) {
        return (
          target.classList.contains('skills-section__keyboard-panel') ||
          target.classList.contains('skills-section__stories-panel')
        )
      }
      if (Array.isArray(target)) {
        return target.some(
          (node) =>
            node instanceof HTMLElement &&
            (node.classList.contains('skills-section__keyboard-panel') ||
              node.classList.contains('skills-section__stories-panel')),
        )
      }
      return false
    })

    expect(forcedVisible).toBe(false)
    expect(ScrollTrigger.create).toHaveBeenCalled()
  })

  it('does not animate Experience layout during the Projects scrub', () => {
    const { section, pin, panel } = mountProjectsDom({ withExperience: true })
    createProjectsScrollController({ section, pin, panel }).dispose()

    const motion = document.querySelector('.experience-section__motion')
    const experience = document.getElementById('experience')
    const layoutTween = [...timelineApi.fromTo.mock.calls, ...timelineApi.to.mock.calls].some(
      (call) => call[0] === motion || call[0] === experience,
    )
    expect(layoutTween).toBe(false)

    const marginTween = gsapSet.mock.calls.some((call) => {
      const vars = call[1] as { marginTop?: number; clearProps?: string } | undefined
      return (
        call[0] === motion &&
        (vars?.marginTop !== undefined ||
          Boolean(vars?.clearProps?.includes('marginTop')))
      )
    })
    expect(marginTween).toBe(false)
  })

  it('coalesces refresh after portfolio scroll handoff', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      }),
    )

    const { section, pin, panel } = mountProjectsDom()
    const controller = createProjectsScrollController({ section, pin, panel })
    expect(frames.length).toBeGreaterThan(0)
    const before = vi.mocked(ScrollTrigger.refresh).mock.calls.length

    // Flush the mount refresh, then fire two handoffs in one frame.
    frames.splice(0).forEach((cb) => cb(0))
    const afterMount = vi.mocked(ScrollTrigger.refresh).mock.calls.length
    expect(afterMount).toBeGreaterThan(before)

    window.dispatchEvent(new CustomEvent('portfolio-scroll-handoff'))
    window.dispatchEvent(new CustomEvent('portfolio-scroll-handoff'))
    expect(frames).toHaveLength(1)
    frames[0]?.(0)
    expect(vi.mocked(ScrollTrigger.refresh).mock.calls.length).toBe(
      afterMount + 1,
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

  it('does not clear pending Skills entrance props on dispose', () => {
    const { section, pin, panel } = mountProjectsDom({ withSkills: true })
    const keyboard = document.querySelector('.skills-section__keyboard-panel')!
    gsapSet.mockClear()

    createProjectsScrollController({ section, pin, panel }).dispose()

    const clearedSkills = gsapSet.mock.calls.some((call) => {
      const vars = call[1] as { clearProps?: string } | undefined
      return (
        Boolean(vars?.clearProps?.includes('opacity')) &&
        (call[0] === keyboard ||
          (Array.isArray(call[0]) && call[0].includes(keyboard)))
      )
    })
    expect(clearedSkills).toBe(false)
  })
})
