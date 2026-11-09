import { FLUID_RESOLUTION } from './FluidConfig'
import type { DoubleBuffer, FluidMaskSource, RenderTarget } from './types'
import {
  createDoubleBuffer,
  createFramebufferFromTexture,
  createSimulationTexture2D,
  type ResourceManager,
} from '../../lib/webgl'

const {
  displayW: W,
  displayH: H,
  velocityW: VW,
  velocityH: VH,
  dyeW: DW,
  dyeH: DH,
} = FLUID_RESOLUTION

export type FluidBufferSet = {
  original: WebGLTexture
  velocity: DoubleBuffer
  pressure: DoubleBuffer
  curl: RenderTarget
  divergence: RenderTarget
  inkForward: RenderTarget
  ink: DoubleBuffer
  velTexel: [number, number]
  dyeTexel: [number, number]
}

export function createFluidBuffers(
  gl: WebGL2RenderingContext,
  resources: ResourceManager,
  mask: FluidMaskSource,
): FluidBufferSet {
  const floatLinear = Boolean(gl.getExtension('OES_texture_float_linear'))

  function texture(
    width: number,
    height: number,
    format: number,
    type: number,
    data: HTMLCanvasElement | null = null,
  ) {
    return createSimulationTexture2D(
      gl,
      resources,
      width,
      height,
      format,
      type,
      floatLinear,
      data ?? undefined,
    )
  }

  function target(w: number, h: number): RenderTarget {
    const tex = texture(w, h, gl.RGBA16F, gl.HALF_FLOAT)
    return createFramebufferFromTexture(
      gl,
      resources,
      tex,
      { clearColor: [0, 0, 0, 0] },
      'Float framebuffer incomplete',
    )
  }

  function dyeTarget(w: number, h: number): RenderTarget {
    const tex = texture(w, h, gl.RGBA8, gl.UNSIGNED_BYTE)
    return createFramebufferFromTexture(
      gl,
      resources,
      tex,
      { clearColor: [0, 0, 0, 0] },
      'Dye framebuffer incomplete',
    )
  }

  function doubleBuffer(w: number, h: number): DoubleBuffer {
    return createDoubleBuffer(target(w, h), target(w, h))
  }

  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = W
  maskCanvas.height = H
  const context = maskCanvas.getContext('2d')
  if (!context) throw new Error('Cannot draw RC mask')
  context.scale(2, 2)
  context.fillStyle = '#000'
  for (const path of mask.maskPaths) {
    context.fill(new Path2D(path))
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  const original = texture(W, H, gl.RGBA8, gl.UNSIGNED_BYTE, maskCanvas)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)

  const velocity = doubleBuffer(VW, VH)
  const pressure = doubleBuffer(VW, VH)
  const curl = target(VW, VH)
  const divergence = target(VW, VH)
  const inkForward = dyeTarget(DW, DH)
  const ink = createDoubleBuffer(dyeTarget(DW, DH), dyeTarget(DW, DH))

  return {
    original,
    velocity,
    pressure,
    curl,
    divergence,
    inkForward,
    ink,
    velTexel: [1 / VW, 1 / VH],
    dyeTexel: [1 / DW, 1 / DH],
  }
}
