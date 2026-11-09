import type { ResourceManager } from '../types'

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
  resources: ResourceManager,
  label = 'shader',
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error(`Unable to create ${label}`)
  resources.track(() => gl.deleteShader(shader))
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || `${label} compile failed`)
  }
  return shader
}
