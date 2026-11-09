import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_CHANGE_EVENT } from '../../../shared/theme'
import { attachIntroTheme } from './attachIntroTheme'
import type { IntroRuntime } from './introRuntime'

function minimalRuntime(): IntroRuntime {
  return {
    root: document.createElement('div'),
    svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement,
    canvas: document.createElement('canvas'),
    transitionCanvas: document.createElement('canvas'),
    stage: document.createElement('div'),
    mark: document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement,
    bloom: document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement,
    displacement: document.createElementNS(
      'http://www.w3.org/2000/svg',
      'feDisplacementMap',
    ) as SVGFEDisplacementMapElement,
    bloomScale: 24,
    reducedMotion: false,
    renderer: {
      setInkColors: vi.fn(),
      draw: vi.fn(),
      dispose: vi.fn(),
    },
    useSvgFallback: false,
    inkTransition: {
      setInkColors: vi.fn(),
      capture: vi.fn(),
      captureAsync: vi.fn(),
      warmSeedCache: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    },
    liquidState: { strength: 0 },
    pointer: { x: 0.5, y: 0.5 },
    target: { x: 0.5, y: 0.5 },
    impulse: { x: 0, y: 0 },
    lastFramePointer: { x: 0.5, y: 0.5 },
    presence: 0,
    proximity: 0,
    pointerInside: false,
    lastPointerTime: 0,
    transitionProgress: 0,
    transitionStartTime: 0,
    capturedTransition: false,
    fluidDebug: false,
    debugFrame: 0,
  }
}

describe('attachIntroTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('registers and removes a theme listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const runtime = minimalRuntime()
    const release = attachIntroTheme(runtime)
    expect(addSpy).toHaveBeenCalledWith(THEME_CHANGE_EVENT, expect.any(Function))
    release()
    expect(removeSpy).toHaveBeenCalledWith(THEME_CHANGE_EVENT, expect.any(Function))
  })
})
