import type { ResourceManager } from '../types'

export const FULLSCREEN_QUAD_TRIANGLES = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
])

export function createStaticBuffer(
  gl: WebGL2RenderingContext,
  data: ArrayBufferView,
  resources: ResourceManager,
  usage: number = gl.STATIC_DRAW,
): WebGLBuffer {
  const buffer = gl.createBuffer()
  if (!buffer) throw new Error('Unable to allocate vertex buffer')
  resources.track(() => gl.deleteBuffer(buffer))
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, usage)
  return buffer
}

export type FullscreenQuadVAO = {
  vao: WebGLVertexArrayObject
  buffer: WebGLBuffer
}

export function createFullscreenQuadVAO(
  gl: WebGL2RenderingContext,
  resources: ResourceManager,
  attribLocation = 0,
): FullscreenQuadVAO {
  const buffer = createStaticBuffer(gl, FULLSCREEN_QUAD_TRIANGLES, resources)
  const vao = gl.createVertexArray()
  if (!vao) throw new Error('Unable to allocate vertex array')
  resources.track(() => gl.deleteVertexArray(vao))
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(attribLocation)
  gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  return { vao, buffer }
}
