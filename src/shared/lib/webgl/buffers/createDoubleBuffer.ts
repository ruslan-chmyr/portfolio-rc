import type { GpuDoubleBuffer, GpuRenderTarget } from '../types'

export function createDoubleBuffer(
  read: GpuRenderTarget,
  write: GpuRenderTarget,
): GpuDoubleBuffer {
  return {
    read,
    write,
    swap() {
      const swapTarget = this.read
      this.read = this.write
      this.write = swapTarget
    },
  }
}
