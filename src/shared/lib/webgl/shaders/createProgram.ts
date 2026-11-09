import type { ResourceManager } from '../types'
import { compileShader } from './compileShader'

export function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  resources: ResourceManager,
  label = 'program',
): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource, resources, `${label} vertex`)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource, resources, `${label} fragment`)
  return linkProgramWithShaders(gl, vertex, fragment, resources, label)
}

export function linkProgramWithShaders(
  gl: WebGL2RenderingContext,
  vertex: WebGLShader,
  fragment: WebGLShader,
  resources: ResourceManager,
  label = 'program',
  detachAfterLink = true,
): WebGLProgram {
  const program = gl.createProgram()
  if (!program) throw new Error(`Unable to create ${label}`)
  resources.track(() => gl.deleteProgram(program))
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || `${label} link failed`)
  }
  if (detachAfterLink) {
    gl.detachShader(program, vertex)
    gl.detachShader(program, fragment)
  }
  return program
}

export function createProgramFromFragment(
  gl: WebGL2RenderingContext,
  sharedVertex: WebGLShader,
  fragmentSource: string,
  resources: ResourceManager,
  label = 'program',
): WebGLProgram {
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource, resources, `${label} fragment`)
  return linkProgramWithShaders(gl, sharedVertex, fragment, resources, label, true)
}
