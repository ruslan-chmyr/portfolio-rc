// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('coalesces refresh scheduling into one animation frame', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        frames.push(cb)
        return frames.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const refresh = vi.fn()
    const state = { raf: 0, pending: false }
    scheduleScrollTriggerRefresh(refresh, state)
    scheduleScrollTriggerRefresh(refresh, state)
    expect(frames).toHaveLength(1)
    frames[0]?.(0)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(state.pending).toBe(false)

    scheduleScrollTriggerRefresh(refresh, state)
    expect(frames).toHaveLength(2)
    cancelScheduledScrollTriggerRefresh(state)
    expect(state.raf).toBe(0)
    expect(state.pending).toBe(false)
  })
})
