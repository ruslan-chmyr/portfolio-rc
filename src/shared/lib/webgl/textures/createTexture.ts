import type { ResourceManager, Texture2DParams } from '../types'

export function createTexture2D(
  gl: WebGL2RenderingContext,
  resources: ResourceManager,
  params: Texture2DParams,
): WebGLTexture {
  const texture = gl.createTexture()
  if (!texture) throw new Error('Texture allocation failed')
  resources.track(() => gl.deleteTexture(texture))
  gl.bindTexture(gl.TEXTURE_2D, texture)
  const minFilter = params.minFilter ?? gl.LINEAR
  const magFilter = params.magFilter ?? minFilter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, params.wrapS ?? gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, params.wrapT ?? gl.CLAMP_TO_EDGE)
  if (params.source) {
    gl.texImage2D(gl.TEXTURE_2D, 0, params.internalFormat, gl.RGBA, params.type, params.source)
    return texture
  }
  const allocateStorage = params.allocateStorage ?? true
  if (allocateStorage && params.width && params.height) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      params.internalFormat,
      params.width,
      params.height,
      0,
      gl.RGBA,
      params.type,
      null,
    )
  }
  return texture
}

/** Fluid sim: HALF_FLOAT uses NEAREST when OES_texture_float_linear is unavailable. */
export function createSimulationTexture2D(
  gl: WebGL2RenderingContext,
  resources: ResourceManager,
  width: number,
  height: number,
  internalFormat: number,
  type: number,
  floatLinearEnabled: boolean,
  source?: TexImageSource | null,
): WebGLTexture {
  const filter = type === gl.HALF_FLOAT && !floatLinearEnabled ? gl.NEAREST : gl.LINEAR
  return createTexture2D(gl, resources, {
    width,
    height,
    internalFormat,
    type,
    source: source ?? null,
    minFilter: filter,
    magFilter: filter,
  })
}
