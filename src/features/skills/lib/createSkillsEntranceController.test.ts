// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('gsap', () => {
  const set = vi.fn()
  const timeline = vi.fn(() => {
    const tl = {
      to: vi.fn().mockReturnThis(),
      kill: vi.fn(),
    }
    return tl
  })
  return {
    default: {
      set,
      timeline,
    },
  }
})

import gsap from 'gsap'
import { createSkillsEntranceController } from './createSkillsEntranceController'

function mountTargets() {
  const section = document.createElement('section')
  const chromeA = document.createElement('div')
  const chromeB = document.createElement('div')
  const keyboard = document.createElement('div')
  const stories = document.createElement('aside')
  section.append(chromeA, chromeB, keyboard, stories)
  document.body.append(section)
  return { section, chrome: [chromeA, chromeB], keyboard, stories }
}

describe('createSkillsEntranceController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('seeds pending shells for desktop motion and plays once from alignment', () => {
    const targets = mountTargets()
    const controller = createSkillsEntranceController(targets, {
      reducedMotion: false,
      isMobile: false,
    })

    expect(targets.section.dataset.skillsEntrance).toBe('pending')
    expect(gsap.set).toHaveBeenCalled()

    controller.playFromAlignment()
    expect(controller.hasPlayed()).toBe(true)
    expect(targets.section.dataset.skillsEntrance).toBe('playing')
    expect(gsap.timeline).toHaveBeenCalledTimes(1)

    controller.playFromAlignment()
    expect(gsap.timeline).toHaveBeenCalledTimes(1)

    controller.dispose()
    expect(targets.section.dataset.skillsEntrance).toBe('done')
  })

  it('shows instantly for reduced motion', () => {
    const targets = mountTargets()
    const controller = createSkillsEntranceController(targets, {
      reducedMotion: true,
      isMobile: false,
    })

    expect(targets.section.dataset.skillsEntrance).toBe('done')
    expect(controller.hasPlayed()).toBe(true)
    controller.dispose()
  })
})
