import { afterEach, describe, expect, it } from 'vitest'
import {
  preloadProjectBookScene,
  resetProjectBookScenePreload,
} from './useProjectsBookModule'

afterEach(() => {
  resetProjectBookScenePreload()
})

describe('preloadProjectBookScene', () => {
  it('returns a shared promise for the scene chunk', async () => {
    const a = preloadProjectBookScene()
    const b = preloadProjectBookScene()
    expect(a).toBe(b)
    const mod = await a
    expect(mod.ProjectBookScene).toBeTypeOf('function')
  })

  it('allows a fresh promise after reset (retry path)', async () => {
    const first = preloadProjectBookScene()
    await first
    resetProjectBookScenePreload()
    const second = preloadProjectBookScene()
    expect(second).not.toBe(first)
    const mod = await second
    expect(mod.ProjectBookScene).toBeTypeOf('function')
  })
})
