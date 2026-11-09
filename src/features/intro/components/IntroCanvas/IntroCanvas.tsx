import type { RefObject } from 'react'
import './IntroCanvas.css'

export type IntroCanvasRefs = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  transitionCanvasRef: RefObject<HTMLCanvasElement | null>
}

export function IntroCanvas({ canvasRef, transitionCanvasRef }: IntroCanvasRefs) {
  return (
    <>
      <canvas ref={canvasRef} className="intro-animation__liquid-canvas" aria-hidden />
      <canvas ref={transitionCanvasRef} className="intro-animation__transition-canvas" aria-hidden />
    </>
  )
}
