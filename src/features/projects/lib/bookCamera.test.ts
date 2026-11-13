import { describe, expect, it } from 'vitest'
import {
  clampZoomDistance,
  defaultCameraPosition,
  framingDistance,
  isDragGesture,
  openBookWidth,
} from './bookCamera'
import { PROJECT_BOOK_CAMERA } from '../model/projectBookConfig'

describe('bookCamera', () => {
  it('clamps zoom to configured bounds', () => {
    expect(clampZoomDistance(1)).toBe(PROJECT_BOOK_CAMERA.minDistance)
    expect(clampZoomDistance(9)).toBe(PROJECT_BOOK_CAMERA.maxDistance)
    expect(clampZoomDistance(3.2)).toBe(3.2)
  })

  it('frames open book width against aspect', () => {
    const wide = framingDistance({
      worldWidth: openBookWidth(),
      fovDeg: 40,
      aspect: 1.6,
      fill: PROJECT_BOOK_CAMERA.openWidthFill,
    })
    const narrow = framingDistance({
      worldWidth: openBookWidth(),
      fovDeg: 40,
      aspect: 0.7,
      fill: PROJECT_BOOK_CAMERA.openWidthFill,
    })
    expect(wide).toBeGreaterThanOrEqual(PROJECT_BOOK_CAMERA.minDistance)
    expect(wide).toBeLessThanOrEqual(PROJECT_BOOK_CAMERA.maxDistance)
    expect(narrow).toBeGreaterThan(wide)
  })

  it('scales default pose with aspect', () => {
    const a = defaultCameraPosition(1.7)
    const b = defaultCameraPosition(0.8)
    expect(Math.hypot(b.x, b.y, b.z)).toBeGreaterThan(
      Math.hypot(a.x, a.y, a.z),
    )
  })

  it('detects drag past the click threshold', () => {
    expect(isDragGesture(0, 0, 2, 2, 7)).toBe(false)
    expect(isDragGesture(0, 0, 10, 0, 7)).toBe(true)
  })
})
