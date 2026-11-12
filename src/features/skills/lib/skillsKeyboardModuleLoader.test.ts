import { describe, expect, it, vi } from 'vitest'
import {
  createSkillsKeyboardModuleLoader,
  isSkillsKeyboardModuleCancelled,
  SkillsKeyboardModuleCancelledError,
} from './skillsKeyboardModuleLoader'

describe('createSkillsKeyboardModuleLoader', () => {
  it('does not import until request()', () => {
    const importFn = vi.fn(async () => ({
      SkillsKeyboardCanvas: () => null,
    }))
    const loader = createSkillsKeyboardModuleLoader(importFn)
    expect(loader.getStatus()).toBe('idle')
    expect(importFn).not.toHaveBeenCalled()
  })

  it('loads once and reuses the same promise/component', async () => {
    const Canvas = () => null
    const importFn = vi.fn(async () => ({ SkillsKeyboardCanvas: Canvas }))
    const loader = createSkillsKeyboardModuleLoader(importFn)

    const first = loader.request()
    const second = loader.request()
    expect(importFn).toHaveBeenCalledTimes(1)
    expect(loader.getStatus()).toBe('loading')

    await expect(first).resolves.toBe(Canvas)
    await expect(second).resolves.toBe(Canvas)
    expect(loader.getStatus()).toBe('ready')
    expect(loader.getComponent()).toBe(Canvas)

    await expect(loader.request()).resolves.toBe(Canvas)
    expect(importFn).toHaveBeenCalledTimes(1)
  })

  it('records error status on import failure and allows retry', async () => {
    const Canvas = () => null
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValueOnce({ SkillsKeyboardCanvas: Canvas })

    const loader = createSkillsKeyboardModuleLoader(importFn)
    await expect(loader.request()).rejects.toThrow('chunk failed')
    expect(loader.getStatus()).toBe('error')

    await expect(loader.request()).resolves.toBe(Canvas)
    expect(loader.getStatus()).toBe('ready')
    expect(importFn).toHaveBeenCalledTimes(2)
  })

  it('ignores late resolution after cancel', async () => {
    let resolveImport!: (value: {
      SkillsKeyboardCanvas: () => null
    }) => void
    const pending = new Promise<{ SkillsKeyboardCanvas: () => null }>((resolve) => {
      resolveImport = resolve
    })
    const loader = createSkillsKeyboardModuleLoader(() => pending)

    const request = loader.request()
    expect(loader.getStatus()).toBe('loading')
    loader.cancel()
    expect(loader.getStatus()).toBe('idle')

    resolveImport({ SkillsKeyboardCanvas: () => null })
    await expect(request).rejects.toSatisfy(isSkillsKeyboardModuleCancelled)
    expect(loader.getComponent()).toBeNull()
    expect(loader.getStatus()).toBe('idle')
  })

  it('A cancelled, B starts, A resolves first — only B may commit', async () => {
    const Canvas = () => null
    let resolveImport!: (value: { SkillsKeyboardCanvas: () => null }) => void
    const pending = new Promise<{ SkillsKeyboardCanvas: () => null }>((resolve) => {
      resolveImport = resolve
    })
    const importFn = vi.fn(() => pending)
    const loader = createSkillsKeyboardModuleLoader(importFn)

    const requestA = loader.request()
    loader.cancel()
    const requestB = loader.request()

    // Same underlying import — no extra download.
    expect(importFn).toHaveBeenCalledTimes(1)

    resolveImport({ SkillsKeyboardCanvas: Canvas })
    await expect(requestA).rejects.toBeInstanceOf(SkillsKeyboardModuleCancelledError)
    await expect(requestB).resolves.toBe(Canvas)
    expect(loader.getComponent()).toBe(Canvas)
    expect(loader.getStatus()).toBe('ready')
  })

  it('A cancelled, B starts, B settles via shared module without A clobbering', async () => {
    const Canvas = () => null
    let resolveImport!: (value: { SkillsKeyboardCanvas: () => null }) => void
    const pending = new Promise<{ SkillsKeyboardCanvas: () => null }>((resolve) => {
      resolveImport = resolve
    })
    const loader = createSkillsKeyboardModuleLoader(() => pending)

    const requestA = loader.request()
    loader.cancel()
    const requestB = loader.request()

    // Resolve after B claimed — A is stale, B commits.
    resolveImport({ SkillsKeyboardCanvas: Canvas })

    const settled = await Promise.allSettled([requestA, requestB])
    expect(settled[0]?.status).toBe('rejected')
    expect(settled[1]?.status).toBe('fulfilled')
    if (settled[1]?.status === 'fulfilled') {
      expect(settled[1].value).toBe(Canvas)
    }
    expect(loader.getStatus()).toBe('ready')
    expect(loader.getComponent()).toBe(Canvas)
  })

  it('stale request rejection does not mark the loader as error', async () => {
    let resolveImport!: (value: { SkillsKeyboardCanvas: () => null }) => void
    const pending = new Promise<{ SkillsKeyboardCanvas: () => null }>((resolve) => {
      resolveImport = resolve
    })
    const loader = createSkillsKeyboardModuleLoader(() => pending)

    const requestA = loader.request()
    loader.cancel()
    const requestB = loader.request()
    resolveImport({ SkillsKeyboardCanvas: () => null })

    await expect(requestA).rejects.toSatisfy(isSkillsKeyboardModuleCancelled)
    await expect(requestB).resolves.toBeTypeOf('function')
    expect(loader.getStatus()).toBe('ready')
  })

  it('successful load remains cached after cancel attempts', async () => {
    const Canvas = () => null
    const importFn = vi.fn(async () => ({ SkillsKeyboardCanvas: Canvas }))
    const loader = createSkillsKeyboardModuleLoader(importFn)

    await expect(loader.request()).resolves.toBe(Canvas)
    loader.cancel()
    expect(loader.getStatus()).toBe('ready')
    expect(loader.getComponent()).toBe(Canvas)
    await expect(loader.request()).resolves.toBe(Canvas)
    expect(importFn).toHaveBeenCalledTimes(1)
  })
})
