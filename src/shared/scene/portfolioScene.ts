/**
 * Neutral portfolio scene coordination — keeps Skills / Projects / Experience
 * from importing each other's controllers for readiness and ownership flags.
 */

/** Fired when Skills entrance reaches `done`. */
export const SKILLS_ENTRANCE_DONE_EVENT = 'skills-entrance-done'

/** `documentElement.dataset` key while the Projects scrub scene owns the viewport. */
export const PROJECTS_SCENE_DATASET_KEY = 'projectsScene'

export function isProjectsSceneActive(
  root: ParentNode = document.documentElement,
): boolean {
  if (!(root instanceof HTMLElement)) return false
  return root.dataset[PROJECTS_SCENE_DATASET_KEY] === 'active'
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

export function isSkillsEntranceDone(skills: HTMLElement | null): boolean {
  if (!skills) return true
  return skills.dataset.skillsEntrance === 'done'
}

export type ScrollTriggerRefreshState = {
  raf: number
  pending: boolean
}

/**
 * Coalesce ScrollTrigger.refresh() calls that fire in the same frame
 * (resize + handoff + entrance-done often arrive together).
 *
 * Uses an explicit `pending` flag — not the rAF id alone — so sync rAF
 * polyfills/tests cannot leave a stuck lock after the callback runs.
 */
export function scheduleScrollTriggerRefresh(
  refresh: () => void,
  state: ScrollTriggerRefreshState,
): void {
  if (state.pending) return
  state.pending = true
  state.raf = window.requestAnimationFrame(() => {
    state.raf = 0
    state.pending = false
    refresh()
  })
}

export function cancelScheduledScrollTriggerRefresh(
  state: ScrollTriggerRefreshState,
): void {
  if (state.raf) {
    window.cancelAnimationFrame(state.raf)
    state.raf = 0
  }
  state.pending = false
}
