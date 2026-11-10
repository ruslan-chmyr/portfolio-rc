import { useId, useMemo, useRef } from 'react'
import { useIntroAnimation } from '../../hooks/useIntroAnimation'
import { IntroCaption } from './IntroCaption'
import { IntroHeader } from '../IntroHeader/IntroHeader'
import { IntroLogo } from '../IntroLogo/IntroLogo'
import { IntroCanvas } from '../IntroCanvas/IntroCanvas'
import './IntroAnimation.css'

export function IntroAnimation() {
  const filterId = useId().replace(/:/g, '')
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transitionCanvasRef = useRef<HTMLCanvasElement>(null)
  const markRef = useRef<SVGGElement>(null)
  const bloomRef = useRef<SVGPathElement>(null)
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null)

  const introRefs = useMemo(
    () => ({
      rootRef,
      stageRef,
      svgRef,
      canvasRef,
      transitionCanvasRef,
      markRef,
      bloomRef,
      displacementRef,
    }),
    [
      rootRef,
      stageRef,
      svgRef,
      canvasRef,
      transitionCanvasRef,
      markRef,
      bloomRef,
      displacementRef,
    ],
  )

  useIntroAnimation(introRefs)

  return (
    <div ref={rootRef} className="intro-animation">
      <IntroHeader />
      <div ref={stageRef} className="intro-animation__stage" aria-hidden>
        <IntroLogo
          filterId={filterId}
          svgRef={svgRef}
          markRef={markRef}
          bloomRef={bloomRef}
          displacementRef={displacementRef}
        />
        <IntroCanvas canvasRef={canvasRef} transitionCanvasRef={transitionCanvasRef} />
      </div>
      <IntroCaption />
    </div>
  )
}
