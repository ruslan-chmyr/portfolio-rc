import type { RefObject } from 'react'

type AboutIntroTypographyProps = {
  stageRef: RefObject<HTMLDivElement | null>
  seniorRef: RefObject<HTMLDivElement | null>
  frontendRef: RefObject<HTMLDivElement | null>
  engineerRef: RefObject<HTMLDivElement | null>
}

export function AboutIntroTypography({
  stageRef,
  seniorRef,
  frontendRef,
  engineerRef,
}: AboutIntroTypographyProps) {
  return (
    <div className="about-hero-type" aria-hidden>
      <div className="about-hero-type__anchor">
        <div ref={stageRef} className="about-hero-type__stage">
          <div ref={seniorRef} className="about-hero-type__word about-hero-type__word--senior">
            <span className="about-hero-type__line">Senior</span>
          </div>
          <div ref={frontendRef} className="about-hero-type__word about-hero-type__word--frontend">
            <span className="about-hero-type__line">Frontend</span>
          </div>
          <div ref={engineerRef} className="about-hero-type__word about-hero-type__word--engineer">
            <span className="about-hero-type__line">Engineer</span>
          </div>
        </div>
      </div>
    </div>
  )
}
