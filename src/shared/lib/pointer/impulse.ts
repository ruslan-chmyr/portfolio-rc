import type { Vec2 } from '../../graphics/fluid/types'

export type ImpulseConfig = {
  simGrid: number
  presenceMin: number
  d60Min: number
  maxFrameDistanceFactor: number
  gain: number
  kDivisor: number
  kScale: number
}

export type ImpulseInput = {
  dt: number
  pointerInside: boolean
  presence: number
  frameDx: number
  frameDy: number
  strength: number
}

export type ImpulseOutput = {
  impulse: Vec2
  frameDist: number
  d60: number
  canPush: boolean
}

export function computePointerImpulse(
  input: ImpulseInput,
  config: ImpulseConfig,
): ImpulseOutput {
  const frameDist = Math.hypot(input.frameDx, input.frameDy)
  const d60 = frameDist / (input.dt * 60)
  const canPush =
    input.pointerInside && input.presence > config.presenceMin && d60 > config.d60Min
  const impulse = { x: 0, y: 0 }
  if (canPush) {
    const maxFrameDistance = config.maxFrameDistanceFactor * input.dt * 60
    const cappedDistance = Math.min(frameDist, maxFrameDistance)
    const factor = cappedDistance / Math.max(frameDist, 1e-8)
    const speed = cappedDistance / Math.max(input.dt, 1 / 240)
    const k = Math.min(1, config.kScale / (speed * config.simGrid * config.kDivisor))
    const gain = config.simGrid * config.kDivisor * k * 60 * config.gain * input.strength
    impulse.x = input.frameDx * factor * gain
    impulse.y = input.frameDy * factor * gain
  }
  return { impulse, frameDist, d60, canPush }
}

export function smoothPresence(
  current: number,
  desired: number,
  dt: number,
  rate: number,
): number {
  return current + (desired - current) * (1 - Math.exp(-dt * rate))
}

export function desiredPointerPresence(
  pointerInside: boolean,
  elapsedSinceMove: number,
  proximity: number,
  opts: { activeSeconds: number; proximityScale: number; presenceMin: number },
): number {
  if (pointerInside && elapsedSinceMove < opts.activeSeconds) return 1
  if (proximity > opts.presenceMin) return proximity * opts.proximityScale
  return 0
}
