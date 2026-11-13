import { PROJECT_BOOK_CAMERA } from '../model/projectBookConfig'
import { clampZoomDistance } from './bookCamera'

export type BookCameraBounds = {
  distance: number
  canZoomIn: boolean
  canZoomOut: boolean
}

export type BookCameraApi = {
  resetView: () => void
  zoomIn: () => void
  zoomOut: () => void
  getBounds: () => BookCameraBounds
  subscribe: (listener: (bounds: BookCameraBounds) => void) => () => void
}

export function createEmptyBookCameraApi(): BookCameraApi {
  const noopBounds: BookCameraBounds = {
    distance: PROJECT_BOOK_CAMERA.defaultPosition.z,
    canZoomIn: true,
    canZoomOut: true,
  }
  return {
    resetView: () => undefined,
    zoomIn: () => undefined,
    zoomOut: () => undefined,
    getBounds: () => noopBounds,
    subscribe: () => () => undefined,
  }
}

export function boundsFromDistance(distance: number): BookCameraBounds {
  const d = clampZoomDistance(distance)
  return {
    distance: d,
    canZoomIn: d > PROJECT_BOOK_CAMERA.minDistance + 0.03,
    canZoomOut: d < PROJECT_BOOK_CAMERA.maxDistance - 0.03,
  }
}

/** Button zoom uses a clearer step than wheel notches. */
export function toolbarZoomTarget(
  distance: number,
  direction: 'in' | 'out',
  factor = PROJECT_BOOK_CAMERA.toolbarZoomFactor,
): number {
  return clampZoomDistance(
    direction === 'in' ? distance / factor : distance * factor,
  )
}
