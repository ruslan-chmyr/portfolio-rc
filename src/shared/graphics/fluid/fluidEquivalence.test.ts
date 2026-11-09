import { describe, expect, it } from 'vitest'
import { FULLSCREEN_QUAD_TRIANGLES } from '../../lib/webgl/buffers/createBuffer'
import { FLUID_RESOLUTION, FLUID_SIM } from './FluidConfig'

/** Guards refactored modules against accidental simulation tuning changes. */
describe('stable fluids equivalence constants', () => {
  it('keeps display and simulation grid resolutions', () => {
    expect(FLUID_RESOLUTION).toEqual({
      displayW: 1200,
      displayH: 640,
      velocityW: 256,
      velocityH: 136,
      dyeW: 768,
      dyeH: 408,
    })
  })

  it('keeps solver iteration and timestep limits', () => {
    expect(FLUID_SIM.pressureIterations).toBe(20)
    expect(FLUID_SIM.velocityDecay).toBe(3.2)
    expect(FLUID_SIM.velocityDiffuseMix).toBe(0.46)
    expect(FLUID_SIM.postSplatDiffuseMix).toBe(0.5)
    expect(FLUID_SIM.seedRelaxSteps).toEqual([
      { step: 3, interact: 0, rate: 2.4 },
      { step: 2, interact: 0, rate: 2.4 },
    ])
    expect(FLUID_SIM.maxTimestep).toBeCloseTo(1 / 30, 8)
    expect(FLUID_SIM.substepsThreshold).toBeCloseTo(1 / 90, 8)
  })

  it('draws the fullscreen quad as two triangles (6 vertices)', () => {
    expect(FULLSCREEN_QUAD_TRIANGLES.length).toBe(12)
    expect(FULLSCREEN_QUAD_TRIANGLES.length / 2).toBe(6)
  })
})
