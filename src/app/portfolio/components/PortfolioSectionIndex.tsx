import { navigatePortfolioSection } from '../lib/navigatePortfolioSection'
import {
  formatPortfolioSectionLabel,
  PORTFOLIO_NAV_SECTIONS,
  type PortfolioSectionEntry,
} from '../lib/portfolioSections'

export type PortfolioSectionIndexPlacement = 'trailing' | 'leading'

type SectionIndexRowProps = {
  section: PortfolioSectionEntry
  active?: boolean
}

function SectionIndexRow({ section, active = false }: SectionIndexRowProps) {
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

export type PortfolioSectionIndexProps = {
  /** Section marked active in the editorial index. Defaults to About. */
  activeId?: PortfolioSectionEntry['id']
  /**
   * `trailing` — About (top-right).
   * `leading` — mirrored top-left (Experience / Contact).
   */
  placement?: PortfolioSectionIndexPlacement
}

/** Editorial section progress index — inactive rows navigate to that section. */
export function PortfolioSectionIndex({
  activeId = 'about',
  placement = 'trailing',
}: PortfolioSectionIndexProps) {
  const activeIndex = PORTFOLIO_NAV_SECTIONS.findIndex(
    (section) => section.id === activeId,
  )
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0
  const preceding = PORTFOLIO_NAV_SECTIONS.slice(0, resolvedIndex)
  const active = PORTFOLIO_NAV_SECTIONS[resolvedIndex]!
  const following = PORTFOLIO_NAV_SECTIONS.slice(resolvedIndex + 1)

  return (
    <nav
      className={[
        'about-section__index-column',
        placement === 'leading' ? 'about-section__index-column--leading' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Portfolio sections"
      data-placement={placement}
    >
      {preceding.length > 0 ? (
        <div className="about-section__index-stack about-section__index-stack--before">
          {preceding.map((section) => (
            <SectionIndexRow key={section.id} section={section} />
          ))}
        </div>
      ) : null}

      <SectionIndexRow section={active} active />

      {following.length > 0 ? (
        <div className="about-section__index-stack">
          <span
            className="about-section__index-marker about-section__index-marker--active"
            aria-hidden
          />
          {following.map((section) => (
            <SectionIndexRow key={section.id} section={section} />
          ))}
        </div>
      ) : null}
    </nav>
  )
}
