import { PROJECT_BOOK_SCENE } from '../model/projectBookConfig'

export type BookPose = {
  rotX: number
  rotY: number
  rotZ: number
  posY: number
}

export type BookCameraPose = {
  x: number
  y: number
  z: number
}

/** Smoothstep — deterministic ease with hard endpoints. */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/** Cubic ease-in-out with hard endpoints. */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpPose(a: BookPose, b: BookPose, t: number): BookPose {
  return {
    rotX: lerp(a.rotX, b.rotX, t),
    rotY: lerp(a.rotY, b.rotY, t),
    rotZ: lerp(a.rotZ, b.rotZ, t),
    posY: lerp(a.posY, b.posY, t),
  }
}

export function lerpCamera(
  a: BookCameraPose,
  b: BookCameraPose,
  t: number,
): BookCameraPose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  }
}

export function closedPose(): BookPose {
  return { ...PROJECT_BOOK_SCENE.closedPose }
}

export function openPose(): BookPose {
  return { ...PROJECT_BOOK_SCENE.openPose }
}

export function closedCamera(): BookCameraPose {
  return { ...PROJECT_BOOK_SCENE.closedCamera }
}

export function openCamera(): BookCameraPose {
  return { ...PROJECT_BOOK_SCENE.openCamera }
}
