import { describe, expect, it } from 'vitest'
import { PROJECT_BOOK_CAMERA } from '../model/projectBookConfig'
import { boundsFromDistance, toolbarZoomTarget } from './bookCameraApi'

describe('bookCameraApi', () => {
  it('marks zoom bounds from distance', () => {
    expect(boundsFromDistance(PROJECT_BOOK_CAMERA.minDistance).canZoomIn).toBe(
      false,
    )
    expect(boundsFromDistance(PROJECT_BOOK_CAMERA.minDistance).canZoomOut).toBe(
      true,
    )
    expect(boundsFromDistance(PROJECT_BOOK_CAMERA.maxDistance).canZoomOut).toBe(
      false,
    )
    expect(boundsFromDistance(PROJECT_BOOK_CAMERA.maxDistance).canZoomIn).toBe(
      true,
    )
  })

  it('applies toolbar zoom steps within clamps', () => {
    const mid = 3.5
    const closer = toolbarZoomTarget(mid, 'in')
    const farther = toolbarZoomTarget(mid, 'out')
    expect(closer).toBeLessThan(mid)
    expect(farther).toBeGreaterThan(mid)
    expect(toolbarZoomTarget(PROJECT_BOOK_CAMERA.minDistance, 'in')).toBe(
      PROJECT_BOOK_CAMERA.minDistance,
    )
    expect(toolbarZoomTarget(PROJECT_BOOK_CAMERA.maxDistance, 'out')).toBe(
      PROJECT_BOOK_CAMERA.maxDistance,
    )
  })
})
