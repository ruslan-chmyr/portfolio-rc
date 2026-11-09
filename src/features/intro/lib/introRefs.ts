import type { RefObject } from 'react'

export type IntroAnimationRefs = {
  rootRef: RefObject<HTMLDivElement | null>
  stageRef: RefObject<HTMLDivElement | null>
  svgRef: RefObject<SVGSVGElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  transitionCanvasRef: RefObject<HTMLCanvasElement | null>
  markRef: RefObject<SVGGElement | null>
  bloomRef: RefObject<SVGPathElement | null>
  displacementRef: RefObject<SVGFEDisplacementMapElement | null>
}
