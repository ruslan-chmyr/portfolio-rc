import { FLUID_RESOLUTION, FLUID_SIM } from './FluidConfig'
import { createFluidBuffers } from './FluidBuffers'
import {
  createInitialDiagnostics,
  readFluidDebugFromLocation,
} from './FluidDiagnostics'
import { createFluidDisplay } from './FluidDisplay'
import { createFluidPrograms } from './FluidPrograms'
import { createFluidSimulation } from './FluidSimulation'
import type { FluidMaskSource, LiquidRenderer } from './types'
import {
  createFullscreenQuadVAO,
  createResourceManager,
} from '../../lib/webgl'

const { displayW: W, displayH: H } = FLUID_RESOLUTION

export type { LiquidDiagnostics, LiquidRenderer } from './types'

export function createFluidRenderer(
  canvas: HTMLCanvasElement,
  mask: FluidMaskSource,
): LiquidRenderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
  })
  if (!gl) return null
  if (!gl.getExtension('EXT_color_buffer_float')) {
    console.warn('Float render textures unavailable: SVG intro fallback')
    return null
  }

  const resources = createResourceManager()
  try {
    const { vao } = createFullscreenQuadVAO(gl, resources)
    const runtime = createFluidPrograms(gl, vao, resources)
    const buffers = createFluidBuffers(gl, resources, mask)
    const { probeGpu, fluidView } = readFluidDebugFromLocation()
    const simulation = createFluidSimulation(
      runtime,
      buffers,
      fluidView,
      { probeGpu },
      gl,
    )
    const display = createFluidDisplay(gl, runtime, buffers, fluidView)

    simulation.seedAndRelaxInk()

    canvas.width = W
    canvas.height = H
    gl.disable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)

    let disposed = false
    let flowTime = 0
    let lastDiag = createInitialDiagnostics()

    display.present()

    return {
      setInkColors(colors) {
        display.setInkColors(colors)
      },
      draw(strength, presence, proximity, pointer, movement, dt) {
        if (disposed || gl.isContextLost()) return
        flowTime = performance.now() / 1000
        const elapsed = Math.max(0, Math.min(dt, FLUID_SIM.maxTimestep))
        const steps = elapsed > FLUID_SIM.substepsThreshold ? 2 : 1
        for (let i = 0; i < steps; i += 1) {
          lastDiag = simulation.simulate(
            elapsed / steps,
            strength,
            presence,
            proximity,
            pointer,
            movement,
            flowTime,
          )
        }
        display.present()
      },
      getDiagnostics() {
        return lastDiag
      },
      dispose() {
        if (disposed) return
        disposed = true
        resources.disposeAll()
      },
    }
  } catch (error) {
    console.warn('Stable Fluids unavailable; using SVG fallback', error)
    resources.disposeAll()
    return null
  }
}
