/**
 * Live position of the trailing cursor ring (lagging circle).
 * Written by TrailingCursor; read by effects that should track the ring.
 */

export type TrailingCursorRingState = {
  x: number
  y: number
  active: boolean
}

const state: TrailingCursorRingState = {
  x: -100,
  y: -100,
  active: false,
}

export function publishTrailingCursorRing(
  x: number,
  y: number,
  active: boolean,
): void {
  state.x = x
  state.y = y
  state.active = active
}

export function readTrailingCursorRing(): Readonly<TrailingCursorRingState> {
  return state
}
