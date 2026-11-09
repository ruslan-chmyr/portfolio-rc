import { FLUID_RESOLUTION } from './FluidConfig'
import type { FluidBufferSet } from './FluidBuffers'
import type { FluidProgramRuntime } from './FluidPrograms'
import type { InkColors } from './types'

const { displayW: W, displayH: H } = FLUID_RESOLUTION

export type FluidDisplay = {
  setInkColors: (colors: InkColors) => void
  present: () => void
}

export function createFluidDisplay(
  gl: WebGL2RenderingContext,
  runtime: FluidProgramRuntime,
  buffers: FluidBufferSet,
  fluidView: string,
): FluidDisplay {
  let inkColor: [number, number, number] = [0, 0, 0]
  let clearColor: [number, number, number, number] = [1, 1, 1, 1]
  const { programs, run } = runtime
  const { velocity, ink, inkForward, velTexel } = buffers

  function setInkColors(colors: InkColors) {
    inkColor = [colors.ink[0], colors.ink[1], colors.ink[2]]
    clearColor = [colors.clear[0], colors.clear[1], colors.clear[2], 1]
  }

  function present() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, W, H)
    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3])
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (fluidView === 'vel') {
      run(programs.displayVel, null, W, H, [['uVelocity', velocity.read.texture]], {
        uVelTexel: velTexel,
      })
      return
    }
    if (fluidView === 'dye') {
      run(programs.displayDye, null, W, H, [['uInk', ink.read.texture]])
      return
    }
    if (fluidView === 'dyePre') {
      run(programs.displayDye, null, W, H, [['uInk', inkForward.texture]])
      return
    }
    run(programs.display, null, W, H, [['uInk', ink.read.texture]], {
      uInkColor: inkColor,
    })
  }

  return { setInkColors, present }
}
