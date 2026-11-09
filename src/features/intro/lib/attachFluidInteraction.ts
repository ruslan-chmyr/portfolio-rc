import gsap from 'gsap'
import { INTRO_POINTER } from '../model/introConfig'
import {
  pointerProximity,
  sampleCanvasPointer,
  smoothFollow,
} from '../../../shared/lib/pointer/coordinates'
import {
  computePointerImpulse,
  desiredPointerPresence,
  smoothPresence,
} from '../../../shared/lib/pointer/impulse'
import type { IntroRuntime } from './introRuntime'

export type FluidInteractionHandle = {
  draw: () => void
  dispose: () => void
}

/** Pointer listeners + GSAP ticker simulation loop. */
export function attachFluidInteraction(runtime: IntroRuntime): FluidInteractionHandle | null {
  const { renderer, canvas } = runtime
  if (!renderer) return null

  const handlePointerMove = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    runtime.proximity = pointerProximity(event.clientX, event.clientY, bounds, {
      marginPx: INTRO_POINTER.marginPx,
      padXFactor: INTRO_POINTER.padXFactor,
      padYFactor: INTRO_POINTER.padYFactor,
    })
    const sample = sampleCanvasPointer(event.clientX, event.clientY, bounds, runtime.proximity, {
      boundsX: INTRO_POINTER.boundsX,
      boundsY: INTRO_POINTER.boundsY,
      clampX: INTRO_POINTER.clampX,
      clampY: INTRO_POINTER.clampY,
      proximityCutoff: INTRO_POINTER.proximityCutoff,
      proximityMin: INTRO_POINTER.proximityMin,
    })
    if (!sample) return
    runtime.pointerInside = sample.pointerInside
    runtime.target.x = sample.x
    runtime.target.y = sample.y
    runtime.lastPointerTime = performance.now()
  }

  const handlePointerLeave = () => {
    runtime.pointerInside = false
    runtime.proximity = 0
  }

  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerleave', handlePointerLeave)

  const draw = () => {
    if (runtime.transitionProgress > 0) {
      if (
        runtime.transitionProgress < 1 &&
        runtime.capturedTransition &&
        runtime.inkTransition &&
        !runtime.reducedMotion
      ) {
        runtime.inkTransition.render(
          runtime.transitionProgress,
          (performance.now() - runtime.transitionStartTime) / 1000,
        )
      }
      return
    }

    const dt = Math.min(0.05, gsap.ticker.deltaRatio() / 60)
    smoothFollow(runtime.pointer, runtime.target, dt, INTRO_POINTER.followRate)

    const elapsed = (performance.now() - runtime.lastPointerTime) / 1000
    runtime.presence = smoothPresence(
      runtime.presence,
      desiredPointerPresence(runtime.pointerInside, elapsed, runtime.proximity, {
        activeSeconds: INTRO_POINTER.presenceActiveSeconds,
        proximityScale: INTRO_POINTER.presenceProximityScale,
        presenceMin: INTRO_POINTER.presenceMin,
      }),
      dt,
      INTRO_POINTER.presenceDecay,
    )

    const frameDx = runtime.pointer.x - runtime.lastFramePointer.x
    const frameDy = runtime.pointer.y - runtime.lastFramePointer.y
    runtime.lastFramePointer.x = runtime.pointer.x
    runtime.lastFramePointer.y = runtime.pointer.y
    const { impulse: nextImpulse, frameDist, d60, canPush } = computePointerImpulse(
      {
        dt,
        pointerInside: runtime.pointerInside,
        presence: runtime.presence,
        frameDx,
        frameDy,
        strength: runtime.liquidState.strength,
      },
      {
        simGrid: INTRO_POINTER.simGrid,
        presenceMin: INTRO_POINTER.impulsePresenceMin,
        d60Min: INTRO_POINTER.impulseD60Min,
        maxFrameDistanceFactor: INTRO_POINTER.maxFrameDistanceFactor,
        gain: INTRO_POINTER.impulseGain,
        kDivisor: INTRO_POINTER.impulseKDivisor,
        kScale: INTRO_POINTER.impulseKScale,
      },
    )
    runtime.impulse.x = nextImpulse.x
    runtime.impulse.y = nextImpulse.y

    renderer.draw(
      runtime.liquidState.strength,
      runtime.presence,
      runtime.proximity,
      runtime.pointer,
      runtime.impulse,
      dt,
    )

    if (runtime.fluidDebug) {
      runtime.debugFrame += 1
      const diag = renderer.getDiagnostics?.()
      const speed = frameDist / Math.max(dt, 1 / 240)
      const state = {
        pointer: { ...runtime.pointer },
        impulse: { ...runtime.impulse },
        frameDist,
        d60,
        speed,
        presence: runtime.presence,
        proximity: runtime.proximity,
        strength: runtime.liquidState.strength,
        pointerInside: runtime.pointerInside,
        canPush,
        diag,
      }
      ;(window as typeof window & { __fluidDebug?: typeof state }).__fluidDebug = state
      if (runtime.debugFrame % 30 === 0) {
        console.log('[fluid]', state)
      }
    }
  }

  renderer.draw(0, 0, 0, runtime.pointer, runtime.impulse, 1 / 60)
  gsap.ticker.add(draw)

  return {
    draw,
    dispose: () => {
      gsap.ticker.remove(draw)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    },
  }
}
