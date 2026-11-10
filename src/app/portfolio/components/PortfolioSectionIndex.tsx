import {
  formatPortfolioSectionLabel,
  PORTFOLIO_CURRENT_SECTION,
  PORTFOLIO_FOLLOWING_SECTIONS,
} from '../lib/portfolioSections'

type SectionIndexRowProps = {
  number: string
  title: string
  active?: boolean
}

function SectionIndexRow({ number, title, active = false }: SectionIndexRowProps) {
  const label = formatPortfolioSectionLabel(number, title)

  return (
    <p
      className={
        active
          ? 'about-section__index about-section__index--active'
          : 'about-section__index about-section__index--inactive'
      }
    >
      <span className="about-section__index-label" aria-hidden={!active}>
        {label}
      </span>
      <span className="about-section__index-line" aria-hidden />
    </p>
  )
}

export function PortfolioSectionIndex() {
  return (
    <aside className="about-section__index-column" aria-label="Section progress" aria-hidden>
      <SectionIndexRow
        number={PORTFOLIO_CURRENT_SECTION.number}
        title={PORTFOLIO_CURRENT_SECTION.title}
        active
      />
      <div className="about-section__index-stack">
        {PORTFOLIO_FOLLOWING_SECTIONS.map((section) => (
          <SectionIndexRow key={section.id} number={section.number} title={section.title} />
        ))}
      </div>
    </aside>
  )
}
