import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createIntroScrollController } from './createIntroScrollController'

type HandlerMap = Record<string, EventListener>

describe('createIntroScrollController', () => {
  let handlers: HandlerMap
  let progress: number[]
  let removeSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    handlers = {}
    progress = []
    removeSpy = vi.fn()
    vi.stubGlobal('window', {
      innerHeight: 1000,
      addEventListener: (type: string, listener: EventListener) => {
        handlers[type] = listener
      },
      removeEventListener: removeSpy,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function create() {
    return createIntroScrollController({
      distancePx: () => 500,
      keyboardStep: 0.1,
      onProgress: (p) => progress.push(p),
    })
  }

  it('emits initial zero progress once', () => {
    create()
    expect(progress).toEqual([0])
  })

  it('clamps wheel-driven progress and allows reverse scroll', () => {
    const ctrl = create()
    const wheel = handlers.wheel as (event: WheelEvent) => void
    wheel({
      deltaY: 250,
      deltaMode: 0,
      ctrlKey: false,
      cancelable: true,
      preventDefault: vi.fn(),
    } as WheelEvent)
    expect(ctrl.getProgress()).toBeCloseTo(0.5, 5)
    wheel({
      deltaY: -500,
      deltaMode: 0,
      ctrlKey: false,
      cancelable: true,
      preventDefault: vi.fn(),
    } as WheelEvent)
    expect(ctrl.getProgress()).toBe(0)
  })

  it('removes all listeners on dispose', () => {
    const ctrl = create()
    ctrl.dispose()
    expect(removeSpy).toHaveBeenCalled()
  })
})
