import { createFluidRenderer } from '../../../shared/graphics/fluid'
import type { LiquidRenderer, Vec2 } from '../../../shared/graphics/fluid/types'
import { RC_MASK_PATHS } from '../model/monogramDesign'
import { getBloomCoverScale } from './getBloomCoverScale'
import { createInkTransitionRenderer, type InkTransitionRenderer } from './createInkTransitionRenderer'
import type { IntroAnimationRefs } from './introRefs'

export type IntroRuntime = {
  root: HTMLDivElement
  svg: SVGSVGElement
  canvas: HTMLCanvasElement
  transitionCanvas: HTMLCanvasElement
  stage: HTMLDivElement
  mark: SVGGElement
  bloom: SVGPathElement
  displacement: SVGFEDisplacementMapElement
  bloomScale: number
  reducedMotion: boolean
  renderer: LiquidRenderer | null
  useSvgFallback: boolean
  inkTransition: InkTransitionRenderer | null
  liquidState: { strength: number }
  pointer: Vec2
  target: Vec2
  impulse: Vec2
  lastFramePointer: Vec2
  presence: number
  proximity: number
  pointerInside: boolean
  lastPointerTime: number
  transitionProgress: number
  transitionStartTime: number
  capturedTransition: boolean
  fluidDebug: boolean
  debugFrame: number
}

export function resolveIntroRuntime(refs: IntroAnimationRefs): IntroRuntime | null {
  const root = refs.rootRef.current
  const svg = refs.svgRef.current
  const canvas = refs.canvasRef.current
  const transitionCanvas = refs.transitionCanvasRef.current
  const stage = refs.stageRef.current
  const mark = refs.markRef.current
  const bloom = refs.bloomRef.current
  const displacement = refs.displacementRef.current
  if (!root || !svg || !canvas || !transitionCanvas || !stage || !mark || !bloom || !displacement) {
    return null
  }

  root.classList.remove('intro-animation--complete')

  const bloomScale = getBloomCoverScale(svg, bloom)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = reducedMotion
    ? null
    : createFluidRenderer(canvas, { maskPaths: RC_MASK_PATHS })
  const useSvgFallback = !renderer
  const inkTransition = renderer ? createInkTransitionRenderer(transitionCanvas) : null

  return {
    root,
    svg,
    canvas,
    transitionCanvas,
    stage,
    mark,
    bloom,
    displacement,
    bloomScale,
    reducedMotion,
    renderer,
    useSvgFallback,
    inkTransition,
    liquidState: { strength: 0 },
    pointer: { x: 0.5, y: 0.5 },
    target: { x: 0.5, y: 0.5 },
    impulse: { x: 0, y: 0 },
    lastFramePointer: { x: 0.5, y: 0.5 },
    presence: 0,
    proximity: 0,
    pointerInside: false,
    lastPointerTime: performance.now(),
    transitionProgress: 0,
    transitionStartTime: 0,
    capturedTransition: false,
    fluidDebug:
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).has('fluidDebug'),
    debugFrame: 0,
  }
}

export function disposeIntroRuntime(runtime: IntroRuntime) {
  runtime.inkTransition?.dispose()
  runtime.renderer?.dispose()
  delete runtime.root.dataset.scrollProgress
  runtime.root.classList.remove('intro-animation--complete')
}
