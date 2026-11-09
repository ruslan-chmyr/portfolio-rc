import { FLUID_RESOLUTION } from './FluidConfig'
import type { FluidBufferSet } from './FluidBuffers'
import type { LiquidDiagnostics, Vec2 } from './types'

const { velocityW: VW, velocityH: VH, dyeW: DW, dyeH: DH } = FLUID_RESOLUTION

export type FluidDebugOptions = {
  probeGpu: boolean
}

export function readFluidDebugFromLocation(): {
  probeGpu: boolean
  fluidView: string
} {
  const search =
    import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
  return {
    probeGpu: Boolean(search?.has('fluidDebug')),
    fluidView: search?.get('fluidView') ?? '',
  }
}

export function createInitialDiagnostics(): LiquidDiagnostics {
  return {
    splatRan: false,
    active: false,
    interact: 0,
    movementMag: 0,
    velSample: 0,
    inkSample: 0,
  }
}

export function sampleSimulationAtPointer(
  gl: WebGL2RenderingContext,
  buffers: FluidBufferSet,
  pointer: Vec2,
  options: FluidDebugOptions,
): { velSample: number; inkSample: number } {
  if (!options.probeGpu) return { velSample: 0, inkSample: 0 }

  const px = Math.min(VW - 1, Math.max(0, Math.floor(pointer.x * VW)))
  const py = Math.min(VH - 1, Math.max(0, Math.floor(pointer.y * VH)))
  const inkPx = Math.min(DW - 1, Math.max(0, Math.floor(pointer.x * DW)))
  const inkPy = Math.min(DH - 1, Math.max(0, Math.floor(pointer.y * DH)))
  const rgba = new Uint8Array(4)

  gl.bindFramebuffer(gl.FRAMEBUFFER, buffers.velocity.read.framebuffer)
  gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba)
  const velSample = Math.hypot(
    (rgba[0] / 255) * 2.2 - 1.1,
    (rgba[1] / 255) * 2.2 - 1.1,
  )

  gl.bindFramebuffer(gl.FRAMEBUFFER, buffers.ink.read.framebuffer)
  gl.readPixels(inkPx, inkPy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba)
  const inkSample = rgba[0] / 255

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { velSample, inkSample }
}
