import type { GpuRenderTarget, ResourceManager } from '../types'

export type FramebufferOptions = {
  clearColor?: readonly [number, number, number, number]
}

export function createFramebufferFromTexture(
  gl: WebGL2RenderingContext,
  resources: ResourceManager,
  texture: WebGLTexture,
  options?: FramebufferOptions,
  incompleteMessage = 'Framebuffer incomplete',
): GpuRenderTarget {
  const framebuffer = gl.createFramebuffer()
  if (!framebuffer) throw new Error('Framebuffer allocation failed')
  resources.track(() => gl.deleteFramebuffer(framebuffer))
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(incompleteMessage)
  }
  if (options?.clearColor) {
    gl.clearColor(...options.clearColor)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }
  return { texture, framebuffer }
}
