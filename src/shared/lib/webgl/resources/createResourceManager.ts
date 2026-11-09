import type { ResourceManager } from '../types'

export function createResourceManager(): ResourceManager {
  const disposeStack: Array<() => void> = []
  return {
    track(dispose) {
      disposeStack.push(dispose)
    },
    disposeAll() {
      while (disposeStack.length > 0) {
        const cleanup = disposeStack.pop()
        cleanup?.()
      }
    },
  }
}
