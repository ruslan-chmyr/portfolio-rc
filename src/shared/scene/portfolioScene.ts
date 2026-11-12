/**
 * Neutral portfolio scene coordination — keeps Skills / Projects / Experience
 * from importing each other's controllers for readiness and ownership flags.
 */

import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Fired when Skills entrance reaches `done`. */
export const SKILLS_ENTRANCE_DONE_EVENT = 'skills-entrance-done'

/** `documentElement.dataset` key while the Projects scrub scene owns the viewport. */
export const PROJECTS_SCENE_DATASET_KEY = 'projectsScene'

/**
 * Chrome/nav ownership — set only once the blue panel wipe is nearly complete,
 * so Skills rail labels stay until Projects has almost finished covering.
 */
export const PROJECTS_NAV_DATASET_KEY = 'projectsNav'

export function isProjectsSceneActive(
  root: ParentNode = document.documentElement,
): boolean {
  if (!(root instanceof HTMLElement)) return false
  return root.dataset[PROJECTS_SCENE_DATASET_KEY] === 'active'
}

export function isProjectsNavOwned(
  root: ParentNode = document.documentElement,
): boolean {
  if (!(root instanceof HTMLElement)) return false
  return root.dataset[PROJECTS_NAV_DATASET_KEY] === 'owned'
}

export function setProjectsSceneActive(
  section: HTMLElement,
  active: boolean,
): void {
  if (active) {
    document.documentElement.dataset[PROJECTS_SCENE_DATASET_KEY] = 'active'
    section.dataset.projectsActive = 'true'
  } else {
    delete document.documentElement.dataset[PROJECTS_SCENE_DATASET_KEY]
    delete section.dataset.projectsActive
  }
}

export function setProjectsNavOwned(owned: boolean): void {
  if (owned) {
    document.documentElement.dataset[PROJECTS_NAV_DATASET_KEY] = 'owned'
  } else {
    delete document.documentElement.dataset[PROJECTS_NAV_DATASET_KEY]
  }
}

export function isSkillsEntranceDone(skills: HTMLElement | null): boolean {
  if (!skills) return true
  return skills.dataset.skillsEntrance === 'done'
}

export type ScrollTriggerRefreshState = {
  raf: number
  pending: boolean
}

type RefreshWaiter = {
  state: ScrollTriggerRefreshState
  isActive: () => boolean
  before?: () => void
}

const refreshWaiters: RefreshWaiter[] = []
let sharedRefreshRaf = 0
let sharedRefreshPending = false

/**
 * Coalesce global ScrollTrigger.refresh() across section controllers into one
 * call per animation frame. Optional `before` runs for active waiters only
 * (e.g. remasure thresholds) and must not call ScrollTrigger.refresh itself.
 */
export function scheduleScrollTriggerRefresh(
  state: ScrollTriggerRefreshState,
  isActive: () => boolean = () => true,
  before?: () => void,
): void {
  if (state.pending) return
  state.pending = true
  refreshWaiters.push({ state, isActive, before })

  if (sharedRefreshPending) {
    state.raf = sharedRefreshRaf
    return
  }

  sharedRefreshPending = true
  sharedRefreshRaf = window.requestAnimationFrame(() => {
    sharedRefreshRaf = 0
    sharedRefreshPending = false
    const batch = refreshWaiters.splice(0, refreshWaiters.length)
    let shouldRefresh = false
    for (const waiter of batch) {
      waiter.state.pending = false
      waiter.state.raf = 0
      if (!waiter.isActive()) continue
      waiter.before?.()
      shouldRefresh = true
    }
    if (shouldRefresh) ScrollTrigger.refresh()
  })
  state.raf = sharedRefreshRaf
}

export function cancelScheduledScrollTriggerRefresh(
  state: ScrollTriggerRefreshState,
): void {
  state.pending = false
  state.raf = 0
  for (let i = refreshWaiters.length - 1; i >= 0; i -= 1) {
    if (refreshWaiters[i]?.state === state) refreshWaiters.splice(i, 1)
  }
  if (refreshWaiters.length === 0 && sharedRefreshRaf) {
    window.cancelAnimationFrame(sharedRefreshRaf)
    sharedRefreshRaf = 0
    sharedRefreshPending = false
  }
}
