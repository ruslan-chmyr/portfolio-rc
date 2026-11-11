import type { MacropadAssemblyBounds } from '../model/keyboardLayout'
import { KEYBOARD_CAMERA_VIEW, type KeyboardCameraViewConfig } from './keyboardCameraView'

export type KeyboardBounds = MacropadAssemblyBounds

export type KeyboardCameraFraming = {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  distance: number
}

export type KeyboardCameraFitMode = 'rest' | 'flip'

function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180
}

/**
 * Projected half-extents of the macropad AABB under the isometric product shot.
 * This matches the flat board silhouette far better than a bounding sphere
 * (which left large empty margins around the resting keyboard).
 */
export function projectedKeyboardHalfExtents(
  bounds: KeyboardBounds,
  view: KeyboardCameraViewConfig = KEYBOARD_CAMERA_VIEW,
  fit: KeyboardCameraFitMode = 'rest',
  flipPivotY = -0.1,
): { halfX: number; halfY: number } {
  const halfW = bounds.width / 2
  const halfD = bounds.depth / 2
  const elev = degToRad(view.elevationDeg)
  const az = degToRad(Math.abs(view.azimuthDeg))
  const sinE = Math.sin(elev)
  const cosE = Math.cos(elev)
  const sinA = Math.sin(az)
  const cosA = Math.cos(az)

  let halfH = bounds.height / 2
  if (fit === 'flip') {
    // YZ radial envelope while revolving about local X at the flip pivot.
    const radial = Math.hypot(
      halfD,
      Math.max(Math.abs(bounds.maxY - flipPivotY), Math.abs(bounds.minY - flipPivotY)),
    )
    halfH = Math.max(halfH, radial)
  }

  const halfX = halfW * cosA + halfD * sinA
  const halfY = (halfW * sinA + halfD * cosA) * sinE + halfH * cosE
  return { halfX, halfY }
}

/**
 * Container-aware isometric framing from projected AABB extents (not a sphere).
 * Rest mode fills the stage with the sitting macropad; flip mode widens vertical
 * clearance for the 360° revolution.
 */
export function computeKeyboardCameraFraming(
  bounds: KeyboardBounds,
  aspect: number,
  view: KeyboardCameraViewConfig = KEYBOARD_CAMERA_VIEW,
  fit: KeyboardCameraFitMode = 'rest',
  flipPivotY = -0.1,
): KeyboardCameraFraming {
  const safeAspect = Number.isFinite(aspect) && aspect > 0.2 ? aspect : 1
  const fov = safeAspect < 0.9 ? view.narrowFov : view.baseFov
  const vFov = degToRad(fov)
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * safeAspect)
  const topInset = Math.min(0.28, Math.max(0, view.topInset))
  const usableTanV = Math.tan(vFov / 2) * (1 - topInset)
  const tanH = Math.tan(hFov / 2)

  const { halfX, halfY } = projectedKeyboardHalfExtents(bounds, view, fit, flipPivotY)
  const distForWidth = halfX / Math.max(tanH, 1e-4)
  const distForHeight = halfY / Math.max(usableTanV, 1e-4)
  const distance = Math.max(distForWidth, distForHeight) * view.padding

  const elevation = degToRad(view.elevationDeg)
  const azimuth = degToRad(view.azimuthDeg)
  const horizontal = distance * Math.cos(elevation)
  const target: [number, number, number] = [0, view.targetY, 0]

  const position: [number, number, number] = [
    target[0] + Math.sin(azimuth) * horizontal,
    Math.max(target[1] + distance * Math.sin(elevation), bounds.maxY + 0.35),
    target[2] + Math.cos(azimuth) * horizontal,
  ]

  return {
    position,
    target,
    fov,
    distance,
  }
}
