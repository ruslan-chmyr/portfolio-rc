import { PROJECT_BOOK_CAMERA, PROJECT_BOOK_SCENE } from '../model/projectBookConfig'

export type Vec3 = { x: number; y: number; z: number }

export function clampZoomDistance(
  distance: number,
  min = PROJECT_BOOK_CAMERA.minDistance,
  max = PROJECT_BOOK_CAMERA.maxDistance,
): number {
  return Math.min(max, Math.max(min, distance))
}

/** Horizontal span of a fully open two-page spread (world units). */
export function openBookWidth(): number {
  return PROJECT_BOOK_SCENE.pageWidth * 2
}

export function closedBookDepth(): number {
  // Closed stack thickness ≈ sheet count * depth; use a conservative product look.
  return Math.max(0.08, PROJECT_BOOK_SCENE.pageDepth * 12)
}

/**
 * Distance so an object of `worldWidth` fills `fill` of the horizontal FOV.
 * Accounts for aspect so portrait viewports don't clip.
 */
export function framingDistance(args: {
  worldWidth: number
  fovDeg: number
  aspect: number
  fill?: number
}): number {
  const fill = args.fill ?? PROJECT_BOOK_CAMERA.openWidthFill
  const fov = (args.fovDeg * Math.PI) / 180
  const halfWidth = (args.worldWidth / fill) * 0.5
  // Visible half-width at distance d: d * tan(fov/2) * aspect
  const denom = Math.tan(fov * 0.5) * Math.max(0.5, args.aspect)
  if (denom <= 1e-6) return PROJECT_BOOK_CAMERA.maxDistance
  return clampZoomDistance(halfWidth / denom)
}

/** Default camera position, scaled to viewport aspect. */
export function defaultCameraPosition(aspect: number): Vec3 {
  const base = PROJECT_BOOK_CAMERA.defaultPosition
  const framed = framingDistance({
    worldWidth: openBookWidth(),
    fovDeg: PROJECT_BOOK_CAMERA.fov,
    aspect,
  })
  const baseLen = Math.hypot(base.x, base.y, base.z) || 1
  const scale = framed / baseLen
  return {
    x: base.x * scale,
    y: base.y * scale,
    z: base.z * scale,
  }
}

export function defaultCameraTarget(): Vec3 {
  return { ...PROJECT_BOOK_CAMERA.target }
}

export function isDragGesture(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thresholdPx = PROJECT_BOOK_CAMERA.dragThresholdPx,
): boolean {
  const dx = endX - startX
  const dy = endY - startY
  return dx * dx + dy * dy > thresholdPx * thresholdPx
}
