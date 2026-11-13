import { describe, expect, it } from 'vitest'
import { preloadProjectBookScene } from './useProjectsBookModule'

describe('preloadProjectBookScene', () => {
  it('returns a shared promise for the scene chunk', async () => {
    const a = preloadProjectBookScene()
    const b = preloadProjectBookScene()
    expect(a).toBe(b)
    const mod = await a
    expect(mod.ProjectBookScene).toBeTypeOf('function')
  })
})
