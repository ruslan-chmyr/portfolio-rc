import { describe, expect, it } from 'vitest'
import {
  computeKeyboardCameraFraming,
  projectedKeyboardHalfExtents,
} from './keyboardCameraFraming'
import { KEYBOARD_CAMERA_VIEW } from './keyboardCameraView'
import { getMacropadAssemblyBounds } from '../model/keyboardLayout'
import { KEYBOARD_FLIP_PIVOT_Y } from './keyboardFlip'

const sampleBounds = getMacropadAssemblyBounds(KEYBOARD_FLIP_PIVOT_Y)

describe('computeKeyboardCameraFraming', () => {
  it('returns a finite elevated three-quarter camera for wide and narrow aspects', () => {
    const wide = computeKeyboardCameraFraming(sampleBounds, 1.4)
    const narrow = computeKeyboardCameraFraming(sampleBounds, 0.7)

    expect(wide.position.every(Number.isFinite)).toBe(true)
    expect(narrow.position.every(Number.isFinite)).toBe(true)
    expect(wide.position[1]).toBeGreaterThan(1)
    expect(narrow.fov).toBeGreaterThanOrEqual(wide.fov)
    expect(wide.distance).toBeGreaterThan(sampleBounds.width * 0.35)
    expect(narrow.distance).toBeGreaterThan(wide.distance * 0.75)
  })

  it('places the camera on the reversed diagonal (lower-left → upper-right board)', () => {
    const framing = computeKeyboardCameraFraming(sampleBounds, 1.2)
    expect(framing.position[0]).toBeLessThan(0)
    expect(framing.position[1]).toBeGreaterThan(0)
    expect(framing.position[2]).toBeGreaterThan(0)

    const horizontal = Math.hypot(framing.position[0], framing.position[2])
    const elevation = Math.atan2(framing.position[1], horizontal) * (180 / Math.PI)
    expect(elevation).toBeGreaterThan(KEYBOARD_CAMERA_VIEW.elevationDeg - 8)
    expect(elevation).toBeLessThan(KEYBOARD_CAMERA_VIEW.elevationDeg + 12)
  })

  it('frames the resting silhouette tighter than a sphere fit, with flip adding height', () => {
    const restProj = projectedKeyboardHalfExtents(
      sampleBounds,
      KEYBOARD_CAMERA_VIEW,
      'rest',
      KEYBOARD_FLIP_PIVOT_Y,
    )
    const flipProj = projectedKeyboardHalfExtents(
      sampleBounds,
      KEYBOARD_CAMERA_VIEW,
      'flip',
      KEYBOARD_FLIP_PIVOT_Y,
    )
    expect(restProj.halfX).toBeLessThan(sampleBounds.fitRadius)
    expect(restProj.halfY).toBeLessThan(sampleBounds.fitRadius)
    expect(flipProj.halfY).toBeGreaterThan(restProj.halfY)

    const rest = computeKeyboardCameraFraming(
      sampleBounds,
      1.15,
      KEYBOARD_CAMERA_VIEW,
      'rest',
      KEYBOARD_FLIP_PIVOT_Y,
    )
    const flip = computeKeyboardCameraFraming(
      sampleBounds,
      0.7,
      KEYBOARD_CAMERA_VIEW,
      'flip',
      KEYBOARD_FLIP_PIVOT_Y,
    )
    // Rest product shot stays closer than framing the flip sphere at the same FOV.
    const sphereDist =
      (sampleBounds.fitRadius / Math.tan(((KEYBOARD_CAMERA_VIEW.baseFov / 2) * Math.PI) / 180)) *
      KEYBOARD_CAMERA_VIEW.padding
    expect(rest.distance).toBeLessThan(sphereDist)
    expect(flip.distance).toBeGreaterThan(0)
  })

  it('keeps a modest safe margin after projected fit', () => {
    expect(KEYBOARD_CAMERA_VIEW.padding).toBeGreaterThanOrEqual(1.05)
    expect(KEYBOARD_CAMERA_VIEW.padding).toBeLessThanOrEqual(1.1)
    expect(KEYBOARD_CAMERA_VIEW.topInset).toBeLessThanOrEqual(0.08)
  })
})

describe('getMacropadAssemblyBounds', () => {
  it('includes chassis padding, height, and flip clearance beyond the key grid', () => {
    expect(sampleBounds.width).toBeGreaterThan(5)
    expect(sampleBounds.depth).toBeGreaterThan(4)
    expect(sampleBounds.height).toBeGreaterThan(1)
    expect(sampleBounds.fitRadius).toBeGreaterThan(sampleBounds.width / 2)
    expect(sampleBounds.fitRadius).toBeGreaterThan(sampleBounds.depth / 2)
  })
})
