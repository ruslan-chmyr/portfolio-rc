import { FLUID_RESOLUTION, FLUID_SIM } from './FluidConfig'
import type { FluidBufferSet } from './FluidBuffers'
import type { FluidProgramRuntime } from './FluidPrograms'
import {
  sampleSimulationAtPointer,
  type FluidDebugOptions,
} from './FluidDiagnostics'
import type { LiquidDiagnostics, Vec2 } from './types'

const { velocityW: VW, velocityH: VH, dyeW: DW, dyeH: DH } = FLUID_RESOLUTION

export type FluidSimulation = {
  seedAndRelaxInk: () => void
  simulate: (
    step: number,
    strength: number,
    presence: number,
    proximity: number,
    pointer: Vec2,
    movement: Vec2,
    flowTime: number,
  ) => LiquidDiagnostics
}

export function createFluidSimulation(
  runtime: FluidProgramRuntime,
  buffers: FluidBufferSet,
  fluidView: string,
  debug: FluidDebugOptions,
  gl: WebGL2RenderingContext,
): FluidSimulation {
  const { programs, run } = runtime
  const {
    original,
    velocity,
    pressure,
    curl,
    divergence,
    inkForward,
    ink,
    velTexel,
    dyeTexel,
  } = buffers

  let secondsSinceSplat = 10

  const seedInk = () => {
    run(programs.seed, ink.write, DW, DH, [['uOriginal', original]])
    ink.swap()
  }

  const relaxInk = (step: number, interact: number, restoreRate: number) => {
    run(
      programs.restore,
      ink.write,
      DW,
      DH,
      [
        ['uInk', ink.read.texture],
        ['uOriginal', original],
      ],
      { uDelta: step, uRestore: restoreRate, uInteract: interact },
    )
    ink.swap()
  }

  function seedAndRelaxInk() {
    seedInk()
    for (const pass of FLUID_SIM.seedRelaxSteps) {
      relaxInk(pass.step, pass.interact, pass.rate)
    }
  }

  function simulate(
    step: number,
    strength: number,
    presence: number,
    proximity: number,
    pointer: Vec2,
    movement: Vec2,
    flowTime: number,
  ): LiquidDiagnostics {
    const interact = Math.min(1, Math.max(presence, proximity * 0.92))
    const movementMag = Math.hypot(movement.x, movement.y)
    const injecting = interact > 0.04 && movementMag > 0.035
    // Keep the solver alive briefly so residual velocity can dissipate.
    // Being near the logo must NOT hold the system in its weak-restore state.
    secondsSinceSplat = injecting ? 0 : secondsSinceSplat + step
    const active = injecting || secondsSinceSplat < FLUID_SIM.residualActiveSeconds
    let splatRan = false

    if (active) {
      if (injecting) {
        splatRan = true
        run(
          programs.splat,
          velocity.write,
          VW,
          VH,
          [['uVelocity', velocity.read.texture]],
          {
            uPoint: [pointer.x, pointer.y],
            uForce: [movement.x, movement.y],
            uRadius: 0.056 + strength * 0.006,
            uTime: flowTime,
            uProximity: Math.min(1, interact * 0.72 + proximity * 0.28),
          },
        )
        velocity.swap()
        run(
          programs.diffuseVel,
          velocity.write,
          VW,
          VH,
          [['uVelocity', velocity.read.texture]],
          { uTexel: velTexel, uMix: FLUID_SIM.postSplatDiffuseMix },
        )
        velocity.swap()
      }

      run(programs.curl, curl, VW, VH, [['uVelocity', velocity.read.texture]], {
        uTexel: velTexel,
      })
      run(
        programs.vorticity,
        velocity.write,
        VW,
        VH,
        [
          ['uVelocity', velocity.read.texture],
          ['uCurl', curl.texture],
        ],
        { uTexel: velTexel, uDelta: step },
      )
      velocity.swap()

      run(
        programs.divergence,
        divergence,
        VW,
        VH,
        [['uVelocity', velocity.read.texture]],
        { uTexel: velTexel },
      )
      for (let i = 0; i < FLUID_SIM.pressureIterations; i += 1) {
        run(
          programs.pressure,
          pressure.write,
          VW,
          VH,
          [
            ['uPressure', pressure.read.texture],
            ['uDivergence', divergence.texture],
          ],
          { uTexel: velTexel },
        )
        pressure.swap()
      }
      run(
        programs.project,
        velocity.write,
        VW,
        VH,
        [
          ['uVelocity', velocity.read.texture],
          ['uPressure', pressure.read.texture],
        ],
        { uTexel: velTexel },
      )
      velocity.swap()

      run(
        programs.diffuseVel,
        velocity.write,
        VW,
        VH,
        [['uVelocity', velocity.read.texture]],
        { uTexel: velTexel, uMix: FLUID_SIM.velocityDiffuseMix },
      )
      velocity.swap()
      run(
        programs.diffuseVel,
        velocity.write,
        VW,
        VH,
        [['uVelocity', velocity.read.texture]],
        { uTexel: velTexel, uMix: FLUID_SIM.velocityDiffuseMix },
      )
      velocity.swap()

      run(
        programs.advectVel,
        velocity.write,
        VW,
        VH,
        [
          ['uVelocity', velocity.read.texture],
          ['uSource', velocity.read.texture],
        ],
        {
          uTexel: velTexel,
          uDelta: step,
          uDecay: FLUID_SIM.velocityDecay,
          uEdgeFade: 1,
        },
      )
      velocity.swap()
    }

    run(
      programs.advectInkForward,
      inkForward,
      DW,
      DH,
      [
        ['uVelocity', velocity.read.texture],
        ['uSource', ink.read.texture],
      ],
      { uVelTexel: velTexel, uDyeTexel: dyeTexel, uDelta: step },
    )

    run(
      programs.advectInkMacCormack,
      ink.write,
      DW,
      DH,
      [
        ['uVelocity', velocity.read.texture],
        ['uForward', inkForward.texture],
        ['uSource', ink.read.texture],
      ],
      {
        uVelTexel: velTexel,
        uDyeTexel: dyeTexel,
        uDelta: step,
        uLoss:
          FLUID_SIM.inkLossBase + (1 - interact) * FLUID_SIM.inkLossIdleBoost,
      },
    )
    ink.swap()

    run(programs.cleanInk, ink.write, DW, DH, [['uInk', ink.read.texture]], {
      uTexel: dyeTexel,
      uMotion: Math.min(1, movementMag * 0.08),
    })
    ink.swap()

    if (fluidView === 'dyePre') {
      run(programs.copyInk, inkForward, DW, DH, [['uInk', ink.read.texture]])
    }

    // Fade the recovery rate in continuously after release. The old
    // piecewise 1.06 -> 2.2 -> 3.39 jumps made the silhouette snap back.
    // A 2.75/s idle rate is ~19% slower than 3.39/s, while still fully
    // restoring the RC instead of leaving lingering ghost contours.
    const idleRecovery =
      1 - Math.exp(-Math.max(0, secondsSinceSplat) * FLUID_SIM.idleRecoveryTau)
    const restoreRate = injecting
      ? FLUID_SIM.restoreRateInjecting
      : FLUID_SIM.restoreRateInjecting +
        (FLUID_SIM.restoreRateIdle - FLUID_SIM.restoreRateInjecting) *
          idleRecovery
    relaxInk(
      step,
      injecting ? Math.min(1, movementMag / 2) : 0,
      restoreRate,
    )

    const samples = sampleSimulationAtPointer(gl, buffers, pointer, debug)
    return {
      splatRan,
      active,
      interact,
      movementMag,
      velSample: samples.velSample,
      inkSample: samples.inkSample,
    }
  }

  return { seedAndRelaxInk, simulate }
}
