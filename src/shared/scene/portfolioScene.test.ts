// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(),
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh,
  },
}))

import {
  PROJECTS_SCENE_DATASET_KEY,
  cancelScheduledScrollTriggerRefresh,
  isProjectsSceneActive,
  isSkillsEntranceDone,
  scheduleScrollTriggerRefresh,
  setProjectsSceneActive,
} from './portfolioScene'

describe('portfolioScene coordination', () => {
  afterEach(() => {
    delete document.documentElement.dataset[PROJECTS_SCENE_DATASET_KEY]
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
    refresh.mockClear()
  })

  it('tracks projects scene active on the document root', () => {
    const section = document.createElement('section')
    expect(isProjectsSceneActive()).toBe(false)
    setProjectsSceneActive(section, true)
    expect(isProjectsSceneActive()).toBe(true)
    expect(section.dataset.projectsActive).toBe('true')
    setProjectsSceneActive(section, false)
    expect(isProjectsSceneActive()).toBe(false)
  })

  it('reads Skills entrance readiness from the section dataset', () => {
    const skills = document.createElement('section')
    expect(isSkillsEntranceDone(null)).toBe(true)
    expect(isSkillsEntranceDone(skills)).toBe(false)
    skills.dataset.skillsEntrance = 'done'
    expect(isSkillsEntranceDone(skills)).toBe(true)
  })

  it('coalesces refreshes from multiple controllers into one ScrollTrigger.refresh', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const beforeA = vi.fn()
    const beforeB = vi.fn()
    const stateA = { raf: 0, pending: false }
    const stateB = { raf: 0, pending: false }

    scheduleScrollTriggerRefresh(stateA, () => true, beforeA)
    scheduleScrollTriggerRefresh(stateB, () => true, beforeB)
    expect(frames).toHaveLength(1)

    frames[0]?.(0)
    expect(beforeA).toHaveBeenCalledTimes(1)
    expect(beforeB).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(stateA.pending).toBe(false)
    expect(stateB.pending).toBe(false)
  })

  it('can cancel a pending owner before the shared frame runs', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const state = { raf: 0, pending: false }
    scheduleScrollTriggerRefresh(state, () => true)
    cancelScheduledScrollTriggerRefresh(state)
    expect(state.raf).toBe(0)
    expect(state.pending).toBe(false)
  })
})
