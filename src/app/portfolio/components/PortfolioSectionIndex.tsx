import { useEffect, useState } from 'react'
import { navigatePortfolioSection } from '../lib/navigatePortfolioSection'
import {
  formatPortfolioSectionLabel,
  PORTFOLIO_CURRENT_SECTION,
  PORTFOLIO_FOLLOWING_SECTIONS,
  type PortfolioSectionEntry,
} from '../lib/portfolioSections'

const MOBILE_INDEX_BAND_MQ = '(max-width: 700px)'

type SectionIndexRowProps = {
  section: PortfolioSectionEntry
  active?: boolean
  /** Mobile band: sticks are decorative (not focusable). */
  decorative?: boolean
}

function SectionIndexRow({
  section,
  active = false,
  decorative = false,
}: SectionIndexRowProps) {
  const label = formatPortfolioSectionLabel(section.number, section.title)

  if (active) {
    return (
      <p
        className="about-section__index about-section__index--active"
        aria-current="page"
      >
        <span className="about-section__index-label">{label}</span>
        <span className="about-section__index-line" aria-hidden />
      </p>
    )
  }

  if (decorative) {
    return (
      <span className="about-section__index about-section__index--inactive" aria-hidden>
        <span className="about-section__index-line" />
      </span>
    )
  }

  return (
    <button
      type="button"
      className="about-section__index about-section__index--inactive"
      aria-label={`Go to ${section.title}`}
      onClick={() => navigatePortfolioSection(section.id)}
    >
      <span className="about-section__index-label">{label}</span>
      <span className="about-section__index-line" aria-hidden />
    </button>
  )
}

/**
 * About-only full editorial section index.
 * Other sections use PortfolioActiveSectionMarker / the Skills rail instead.
 */
export function PortfolioSectionIndex() {
  const [mobileBand, setMobileBand] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_INDEX_BAND_MQ)
    const sync = () => setMobileBand(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <nav className="about-section__index-column" aria-label="Portfolio sections">
      <SectionIndexRow section={PORTFOLIO_CURRENT_SECTION} active />
      <div className="about-section__index-stack">
        <span
          className="about-section__index-marker about-section__index-marker--active"
          aria-hidden
        />
        {PORTFOLIO_FOLLOWING_SECTIONS.map((section) => (
          <SectionIndexRow
            key={section.id}
            section={section}
            decorative={mobileBand}
          />
        ))}
      </div>
    </nav>
  )
}
