import {
  ADVECT_INK_FORWARD,
  ADVECT_INK_MCCORMACK,
  ADVECT_VEL,
  CLEAN_INK,
  COPY_INK,
  CURL,
  DIFFUSE_VEL,
  DIVERGENCE,
  DISPLAY,
  DISPLAY_DYE,
  DISPLAY_VEL,
  PRESSURE,
  PROJECT,
  RESTORE,
  SEED,
  SPLAT,
  VERT,
  VORTICITY,
} from './shaders'
import type { RenderTarget } from './types'
import {
  compileShader,
  createProgramFromFragment,
  type ResourceManager,
} from '../../lib/webgl'

export type FluidShaderPrograms = {
  advectVel: WebGLProgram
  advectInkForward: WebGLProgram
  advectInkMacCormack: WebGLProgram
  splat: WebGLProgram
  curl: WebGLProgram
  vorticity: WebGLProgram
  diffuseVel: WebGLProgram
  divergence: WebGLProgram
  pressure: WebGLProgram
  project: WebGLProgram
  restore: WebGLProgram
  cleanInk: WebGLProgram
  seed: WebGLProgram
  display: WebGLProgram
  displayVel: WebGLProgram
  displayDye: WebGLProgram
  copyInk: WebGLProgram
}

export type FluidPassParams = Record<
  string,
  number | [number, number] | [number, number, number]
>

export type FluidProgramRuntime = {
  programs: FluidShaderPrograms
  run: (
    program: WebGLProgram,
    out: RenderTarget | null,
    width: number,
    height: number,
    inputs: Array<[string, WebGLTexture]>,
    params?: FluidPassParams,
  ) => void
}

export function createFluidPrograms(
  gl: WebGL2RenderingContext,
  vao: WebGLVertexArrayObject,
  resources: ResourceManager,
): FluidProgramRuntime {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERT, resources, 'fluid vertex')
  const makeProgram = (source: string, label: string) =>
    createProgramFromFragment(gl, vertex, source, resources, label)

  const programs: FluidShaderPrograms = {
    advectVel: makeProgram(ADVECT_VEL, 'advectVel'),
    advectInkForward: makeProgram(ADVECT_INK_FORWARD, 'advectInkForward'),
    advectInkMacCormack: makeProgram(ADVECT_INK_MCCORMACK, 'advectInkMacCormack'),
    splat: makeProgram(SPLAT, 'splat'),
    curl: makeProgram(CURL, 'curl'),
    vorticity: makeProgram(VORTICITY, 'vorticity'),
    diffuseVel: makeProgram(DIFFUSE_VEL, 'diffuseVel'),
    divergence: makeProgram(DIVERGENCE, 'divergence'),
    pressure: makeProgram(PRESSURE, 'pressure'),
    project: makeProgram(PROJECT, 'project'),
    restore: makeProgram(RESTORE, 'restore'),
    cleanInk: makeProgram(CLEAN_INK, 'cleanInk'),
    seed: makeProgram(SEED, 'seed'),
    display: makeProgram(DISPLAY, 'display'),
    displayVel: makeProgram(DISPLAY_VEL, 'displayVel'),
    displayDye: makeProgram(DISPLAY_DYE, 'displayDye'),
    copyInk: makeProgram(COPY_INK, 'copyInk'),
  }

  const locationCache = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>()

  function uniform(program: WebGLProgram, name: string) {
    let map = locationCache.get(program)
    if (!map) {
      map = new Map()
      locationCache.set(program, map)
    }
    if (!map.has(name)) map.set(name, gl.getUniformLocation(program, name))
    return map.get(name) ?? null
  }

  function run(
    program: WebGLProgram,
    out: RenderTarget | null,
    width: number,
    height: number,
    inputs: Array<[string, WebGLTexture]>,
    params?: FluidPassParams,
  ) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, out?.framebuffer ?? null)
    gl.viewport(0, 0, width, height)
    gl.useProgram(program)
    gl.bindVertexArray(vao)
    inputs.forEach(([name, tex], i) => {
      const location = uniform(program, name)
      if (!location) throw new Error(`Missing uniform: ${name}`)
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(location, i)
    })
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        const location = uniform(program, name)
        if (!location) continue
        if (Array.isArray(value)) {
          if (value.length === 3) {
            gl.uniform3f(location, value[0], value[1], value[2])
          } else {
            gl.uniform2f(location, value[0], value[1])
          }
        } else {
          gl.uniform1f(location, value)
        }
      }
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  return { programs, run }
}
