import { PROJECT_BOOK_CAMERA } from '../model/projectBookConfig'
import { isDragGesture } from './bookCamera'

/** Mark interactive page meshes for capture-phase ownership raycasts. */
export const BOOK_PAGE_USERDATA_KEY = 'bookPage'

export type BookGestureOwner = 'none' | 'book' | 'orbit'

export type BookGestureState = {
  pointerDown: boolean
  startX: number
  startY: number
  /** True once movement exceeds the click/drag threshold. */
  dragged: boolean
  /** True while OrbitControls reports an active interaction. */
  orbiting: boolean
  /**
   * Initial claim on pointer down.
   * A book-owned gesture may promote to orbit after the drag threshold.
   */
  owner: BookGestureOwner
  pointerId: number | null
}

export function createBookGestureState(): BookGestureState {
  return {
    pointerDown: false,
    startX: 0,
    startY: 0,
    dragged: false,
    orbiting: false,
    owner: 'none',
    pointerId: null,
  }
}

export function beginBookPointer(
  state: BookGestureState,
  clientX: number,
  clientY: number,
  owner: BookGestureOwner = 'none',
  pointerId: number | null = null,
): void {
  state.pointerDown = true
  state.startX = clientX
  state.startY = clientY
  state.dragged = false
  state.owner = owner
  state.pointerId = pointerId
  state.orbiting = false
}

/**
 * Track movement. When a book press crosses the drag threshold, promote to orbit
 * so click-and-hold/drag rotates the camera instead of turning the page.
 */
export function moveBookPointer(
  state: BookGestureState,
  clientX: number,
  clientY: number,
  thresholdPx = PROJECT_BOOK_CAMERA.dragThresholdPx,
): boolean {
  if (!state.pointerDown || state.dragged) return false
  if (!isDragGesture(state.startX, state.startY, clientX, clientY, thresholdPx)) {
    return false
  }
  state.dragged = true
  if (state.owner === 'book') {
    state.owner = 'orbit'
    return true
  }
  return false
}

export function endBookPointer(state: BookGestureState): void {
  state.pointerDown = false
  state.owner = 'none'
  state.orbiting = false
  state.pointerId = null
}

/**
 * Page clicks fire only for a clean press on a page (no drag, not empty-scene orbit).
 * OrbitControls may set orbiting on pointerdown — that alone must not block clicks.
 */
export function shouldSuppressPageClick(state: BookGestureState): boolean {
  if (state.dragged) return true
  if (state.owner === 'orbit') return true
  return false
}

export function setBookOrbiting(
  state: BookGestureState,
  orbiting: boolean,
): void {
  state.orbiting = orbiting
  // Do not mark dragged here: OrbitControls dispatches start on pointerdown
  // before any movement, and a stationary click must still turn the page.
}

export function claimGestureOwner(
  state: BookGestureState,
  owner: BookGestureOwner,
): void {
  if (state.pointerDown && state.owner !== 'none' && state.owner !== owner) {
    // Allow one-way book → orbit promotion only.
    if (!(state.owner === 'book' && owner === 'orbit')) return
  }
  state.owner = owner
}

export function isBookOwnedGesture(state: BookGestureState): boolean {
  return state.owner === 'book'
}

export function isOrbitOwnedGesture(state: BookGestureState): boolean {
  return state.owner === 'orbit'
}
