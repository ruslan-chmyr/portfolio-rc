import {
  findPortfolioSection,
  formatPortfolioSectionLabel,
} from '../lib/portfolioSections'
import {
  portfolioSectionProgressRatio,
  type PortfolioMarkerSectionId,
} from '../lib/portfolioSectionProgress'

export type PortfolioActiveSectionMarkerOrientation = 'vertical' | 'horizontal'

export type PortfolioActiveSectionMarkerProps = {
  sectionId: PortfolioMarkerSectionId
  orientation?: PortfolioActiveSectionMarkerOrientation
  className?: string
}

/**
 * Compact location indicator (label + progress track).
 * Decorative — not a navigation control. Numbers/labels come from portfolioSections.
 */
export function PortfolioActiveSectionMarker({
  sectionId,
  orientation = 'vertical',
  className = '',
}: PortfolioActiveSectionMarkerProps) {
  const entry = findPortfolioSection(sectionId)
  const label = entry
    ? formatPortfolioSectionLabel(entry.number, entry.title)
    : sectionId
  const fill = portfolioSectionProgressRatio(sectionId)

  return (
    <div
      className={[
        'portfolio-active-marker',
        `portfolio-active-marker--${orientation}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-section={sectionId}
      data-orientation={orientation}
    >
      <span className="portfolio-active-marker__label">{label}</span>
      <span className="portfolio-active-marker__track" aria-hidden="true">
        <span
          className="portfolio-active-marker__fill"
          style={{ ['--marker-fill' as string]: `${Math.round(fill * 100)}%` }}
        />
      </span>
    </div>
  )
}
