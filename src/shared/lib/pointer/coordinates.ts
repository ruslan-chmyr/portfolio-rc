import type { Vec2 } from '../../graphics/fluid/types'

export type ProximityConfig = {
  marginPx: number
  padXFactor: number
  padYFactor: number
}

export function pointerProximity(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
  config: ProximityConfig,
): number {
  const padX = bounds.width * config.padXFactor + config.marginPx
  const padY = bounds.height * config.padYFactor + config.marginPx
  const left = bounds.left - padX
  const right = bounds.right + padX
  const top = bounds.top - padY
  const bottom = bounds.bottom + padY
  const cx = Math.min(Math.max(clientX, left), right)
  const cy = Math.min(Math.max(clientY, top), bottom)
  const outside = Math.hypot(clientX - cx, clientY - cy)
  return Math.max(0, 1 - outside / config.marginPx)
}

export type CanvasPointerSample = {
  x: number
  y: number
  pointerInside: boolean
  proximity: number
}

export function sampleCanvasPointer(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
  proximity: number,
  opts: {
    boundsX: readonly [number, number]
    boundsY: readonly [number, number]
    clampX: readonly [number, number]
    clampY: readonly [number, number]
    proximityCutoff: number
    proximityMin: number
  },
): CanvasPointerSample | null {
  if (!bounds.width || !bounds.height) return null
  const x = (clientX - bounds.left) / bounds.width
  const y = 1 - (clientY - bounds.top) / bounds.height
  const pointerInside =
    x >= opts.boundsX[0] &&
    x <= opts.boundsX[1] &&
    y >= opts.boundsY[0] &&
    y <= opts.boundsY[1] &&
    proximity > opts.proximityCutoff
  if (!pointerInside && proximity < opts.proximityMin) return null
  const clampedX = Math.min(Math.max(x, opts.clampX[0]), opts.clampX[1])
  const clampedY = Math.min(Math.max(y, opts.clampY[0]), opts.clampY[1])
  return {
    x: pointerInside ? x : clampedX,
    y: pointerInside ? y : clampedY,
    pointerInside,
    proximity,
  }
}

export function smoothFollow(current: Vec2, target: Vec2, dt: number, rate: number): void {
  const follow = 1 - Math.exp(-dt * rate)
  current.x += (target.x - current.x) * follow
  current.y += (target.y - current.y) * follow
}
