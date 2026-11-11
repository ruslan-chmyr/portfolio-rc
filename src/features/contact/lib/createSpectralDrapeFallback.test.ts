// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const render = vi.fn()
const setSize = vi.fn()
const setPixelRatio = vi.fn()
const setClearColor = vi.fn()
const disposeRenderer = vi.fn()
const loseContext = vi.fn()
const disposeGeometry = vi.fn()
const disposeMaterial = vi.fn()
const sceneAdd = vi.fn()
const sceneRemove = vi.fn()

vi.mock('three', () => {
  class BufferAttribute {
    constructor(
      public array: Float32Array,
      public itemSize: number,
    ) {}
  }
  class BufferGeometry {
    setAttribute = vi.fn()
    dispose = disposeGeometry
  }
  class Color {
    constructor(public hex: string) {}
  }
  class ShaderMaterial {
    uniforms: Record<string, { value: unknown }>
    constructor(params: { uniforms: Record<string, { value: unknown }> }) {
      this.uniforms = params.uniforms
      ;(this as { dispose: () => void }).dispose = disposeMaterial
    }
    dispose = disposeMaterial
  }
  class Points {
    rotation = { set: vi.fn() }
    frustumCulled = true
    constructor(
      public geometry: unknown,
      public material: unknown,
    ) {}
  }
  class Scene {
    add = sceneAdd
    remove = sceneRemove
  }
  class PerspectiveCamera {
    aspect = 1
    position = { set: vi.fn() }
    lookAt = vi.fn()
    updateProjectionMatrix = vi.fn()
    constructor(
      public fov: number,
      public a: number,
      public near: number,
      public far: number,
    ) {}
  }
  class WebGLRenderer {
    setClearColor = setClearColor
    setPixelRatio = setPixelRatio
    setSize = setSize
    render = render
    dispose = disposeRenderer
    getContext = () => ({
      getExtension: () => ({ loseContext }),
    })
    constructor(_params: unknown) {}
  }

  return {
    AdditiveBlending: 2,
    BufferAttribute,
    BufferGeometry,
    Color,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    WebGLRenderer,
  }
})

import { createSpectralDrapeFallback } from './createSpectralDrapeFallback'

describe('createSpectralDrapeFallback', () => {
  beforeEach(() => {
    let rafId = 0
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafId += 1
        // Cap recursive ticks so unpaused loops cannot overflow the suite.
        if (rafId <= 2) {
          queueMicrotask(() => cb(rafId * 16))
        }
        return rafId
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value() {
        return {
          width: 1200,
          height: 800,
          top: 0,
          left: 0,
          right: 1200,
          bottom: 800,
          x: 0,
          y: 0,
          toJSON() {
            return {}
          },
        }
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('bootstraps a WebGL fabric and cleans up on dispose', () => {
    const canvas = document.createElement('canvas')
    document.body.append(canvas)
    const controller = createSpectralDrapeFallback(canvas, {
      reducedMotion: false,
    })

    expect(setSize).toHaveBeenCalled()
    expect(sceneAdd).toHaveBeenCalled()
    expect(render).toHaveBeenCalled()

    controller.dispose()
    expect(disposeRenderer).toHaveBeenCalled()
    expect(disposeGeometry).toHaveBeenCalled()
    expect(disposeMaterial).toHaveBeenCalled()
    expect(loseContext).toHaveBeenCalled()
    canvas.remove()
  })

  it('renders a static frame under reduced motion and stays paused', () => {
    const canvas = document.createElement('canvas')
    const controller = createSpectralDrapeFallback(canvas, {
      reducedMotion: true,
    })
    expect(render).toHaveBeenCalled()
    const framesBefore = vi.mocked(requestAnimationFrame).mock.calls.length
    controller.setPaused(false)
    // Reduced-motion keeps the fabric frozen even if pause is lifted.
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBe(
      framesBefore,
    )
    controller.dispose()
  })

  it('can pause and resume the animation loop', () => {
    const canvas = document.createElement('canvas')
    const controller = createSpectralDrapeFallback(canvas, {
      reducedMotion: false,
    })
    controller.setPaused(true)
    expect(cancelAnimationFrame).toHaveBeenCalled()
    const before = vi.mocked(requestAnimationFrame).mock.calls.length
    controller.setPaused(false)
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBeGreaterThan(
      before,
    )
    controller.dispose()
  })
})
