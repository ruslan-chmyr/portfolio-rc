import { PROJECT_BOOK_CAMERA } from '../model/projectBookConfig'
import { isDragGesture } from './bookCamera'

export type BookGestureState = {
  pointerDown: boolean
  startX: number
  startY: number
  /** True once movement exceeds the click/drag threshold. */
  dragged: boolean
  /** True while OrbitControls reports an active interaction. */
  orbiting: boolean
}

export function createBookGestureState(): BookGestureState {
  return {
    pointerDown: false,
    startX: 0,
    startY: 0,
    dragged: false,
    orbiting: false,
  }
}

export function beginBookPointer(
  state: BookGestureState,
  clientX: number,
  clientY: number,
): void {
  state.pointerDown = true
  state.startX = clientX
  state.startY = clientY
  state.dragged = false
}

export function moveBookPointer(
  state: BookGestureState,
  clientX: number,
  clientY: number,
  thresholdPx = PROJECT_BOOK_CAMERA.dragThresholdPx,
): void {
  if (!state.pointerDown || state.dragged) return
  if (isDragGesture(state.startX, state.startY, clientX, clientY, thresholdPx)) {
    state.dragged = true
  }
}

export function endBookPointer(state: BookGestureState): void {
  state.pointerDown = false
}

/** Page clicks are ignored after a drag or during orbit. */
export function shouldSuppressPageClick(state: BookGestureState): boolean {
  return state.dragged || state.orbiting
}

export function setBookOrbiting(
  state: BookGestureState,
  orbiting: boolean,
): void {
  state.orbiting = orbiting
  if (orbiting) state.dragged = true
}
