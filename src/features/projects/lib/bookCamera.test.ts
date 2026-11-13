import { describe, expect, it } from 'vitest'
import {
  clampZoomDistance,
  decideWheelZoom,
  defaultCameraPosition,
  framingDistance,
  isDragGesture,
  openBookWidth,
  resizePreserveOrbit,
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

  it('owns desktop wheel zoom and yields scroll at max distance', () => {
    expect(
      decideWheelZoom({
        deltaY: 100,
        distance: PROJECT_BOOK_CAMERA.maxDistance,
        coarsePointer: false,
        ctrlOrMeta: false,
      }).action,
    ).toBe('allow-scroll')

    const zoom = decideWheelZoom({
      deltaY: -100,
      distance: 3.5,
      coarsePointer: false,
      ctrlOrMeta: false,
    })
    expect(zoom.action).toBe('zoom')
    if (zoom.action === 'zoom') expect(zoom.factor).toBeLessThan(1)

    expect(
      decideWheelZoom({
        deltaY: 100,
        distance: 3.5,
        coarsePointer: true,
        ctrlOrMeta: true,
      }).action,
    ).toBe('ignore')
  })

  it('preserves orbit direction and only pushes out when aspect would clip', () => {
    const wideFramed = framingDistance({
      worldWidth: openBookWidth(),
      fovDeg: PROJECT_BOOK_CAMERA.fov,
      aspect: 1.7,
    })
    const narrowFramed = framingDistance({
      worldWidth: openBookWidth(),
      fovDeg: PROJECT_BOOK_CAMERA.fov,
      aspect: 0.7,
    })
    expect(narrowFramed).toBeGreaterThan(wideFramed)

    // Close zoom on a narrow viewport must be pushed out to framed distance.
    const nudged = resizePreserveOrbit({
      offsetX: 0,
      offsetY: 0,
      offsetZ: wideFramed,
      aspect: 0.7,
    })
    expect(nudged.distance).toBeCloseTo(narrowFramed)
    expect(nudged.x).toBeCloseTo(0)
    expect(nudged.y).toBeCloseTo(0)
    expect(nudged.z).toBeGreaterThan(0)

    // Already framed (or slightly zoomed out within max) stays put.
    const zoomedOut = Math.min(
      PROJECT_BOOK_CAMERA.maxDistance,
      narrowFramed + 0.25,
    )
    const preserved = resizePreserveOrbit({
      offsetX: 0,
      offsetY: 0,
      offsetZ: zoomedOut,
      aspect: 0.7,
    })
    expect(preserved.distance).toBeCloseTo(zoomedOut)

    // Very short offset is pushed out to the aspect-safe framed distance.
    const tooClose = resizePreserveOrbit({
      offsetX: 1,
      offsetY: 0,
      offsetZ: 0,
      aspect: 1.2,
    })
    const framedAt12 = framingDistance({
      worldWidth: openBookWidth(),
      fovDeg: PROJECT_BOOK_CAMERA.fov,
      aspect: 1.2,
    })
    expect(tooClose.distance).toBeCloseTo(framedAt12)
    expect(tooClose.distance).toBeGreaterThanOrEqual(PROJECT_BOOK_CAMERA.minDistance)
  })
})
