import { describe, expect, it, vi } from 'vitest'
import { createResourceManager } from './createResourceManager'

describe('createResourceManager', () => {
  it('disposes in reverse registration order', () => {
    const calls: string[] = []
    const manager = createResourceManager()
    manager.track(() => calls.push('first'))
    manager.track(() => calls.push('second'))
    manager.track(() => calls.push('third'))
    manager.disposeAll()
    expect(calls).toEqual(['third', 'second', 'first'])
  })

  it('is idempotent when disposeAll is called more than once', () => {
    const dispose = vi.fn()
    const manager = createResourceManager()
    manager.track(dispose)
    manager.disposeAll()
    manager.disposeAll()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
