import type { RefObject } from 'react'
import { RC_DESIGN } from '../../model/monogramDesign'
import { INTRO_TRANSITION } from '../../model/introConfig'
import './IntroLogo.css'

export type IntroLogoRefs = {
  svgRef: RefObject<SVGSVGElement | null>
  markRef: RefObject<SVGGElement | null>
  bloomRef: RefObject<SVGPathElement | null>
  displacementRef: RefObject<SVGFEDisplacementMapElement | null>
}

type IntroLogoProps = IntroLogoRefs & {
  filterId: string
}

export function IntroLogo({
  filterId,
  svgRef,
  markRef,
  bloomRef,
  displacementRef,
}: IntroLogoProps) {
  return (
    <svg
      ref={svgRef}
      className="intro-animation__svg"
      viewBox="0 0 600 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-25%" y="-35%" width="150%" height="170%" colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence" baseFrequency="0.007 0.009" numOctaves="2" seed="8" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.8" result="softNoise" />
          <feDisplacementMap
            ref={displacementRef}
            in="SourceGraphic"
            in2="softNoise"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g ref={markRef} filter={`url(#${filterId})`} className="intro-animation__mark">
        <g className="intro-animation__ink" fill="currentColor">
          <path d={RC_DESIGN.r} />
          <path d={RC_DESIGN.c} />
        </g>
      </g>
      <path
        ref={bloomRef}
        className="intro-animation__bloom intro-animation__ink"
        fill="currentColor"
        d={INTRO_TRANSITION.bloomPath}
      />
    </svg>
  )
}
