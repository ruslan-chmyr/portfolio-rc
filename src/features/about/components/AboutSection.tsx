import { useMemo, useRef } from 'react'
import { useAboutScrollAnimation } from '../hooks/useAboutScrollAnimation'
import { AboutContent } from './AboutContent'
import { AboutIntroTypography } from './AboutIntroTypography'
import { PortfolioNav, PortfolioSectionIndex } from '../../../app/portfolio'
import { AboutTechAmbient } from './AboutTechAmbient'
import '../../../app/portfolio/styles/portfolio-chrome.css'
import '../styles/about.css'
import '../styles/about-hero-type.css'
import '../styles/about-content.css'

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const typeStageRef = useRef<HTMLDivElement>(null)
  const seniorRef = useRef<HTMLDivElement>(null)
  const frontendRef = useRef<HTMLDivElement>(null)
  const engineerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)

  const scrollTargets = useMemo(
    () => ({
      sectionRef,
      pinRef,
      typeStageRef,
      seniorRef,
      frontendRef,
      engineerRef,
      contentRef,
    }),
    [],
  )

  useAboutScrollAnimation(scrollTargets, true)

  return (
    <section
      ref={sectionRef}
      className="about-section"
      aria-labelledby="about-heading"
    >
      <div ref={pinRef} className="about-section__pin">
        <PortfolioNav />
        <AboutIntroTypography
          stageRef={typeStageRef}
          seniorRef={seniorRef}
          frontendRef={frontendRef}
          engineerRef={engineerRef}
        />
        <PortfolioSectionIndex />
        <AboutTechAmbient />
        <AboutContent contentRef={contentRef} />
        <p className="about-section__scroll-label" aria-hidden>
          <span>Scroll</span>
          <span className="about-section__scroll-arrow" aria-hidden>
            ↓
          </span>
        </p>
      </div>
      <div className="about-section__continuation" aria-hidden />
    </section>
  )
}
