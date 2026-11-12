import {
  PORTFOLIO_NAV_SECTIONS,
  type PortfolioSectionId,
} from './portfolioSections'

export type PortfolioMarkerSectionId = Exclude<PortfolioSectionId, 'intro'>

/**
 * Progress-track fill (0–1) for the compact active-section marker.
 * Derived from registry order so Skills/Projects rail and Experience/Contact stay aligned.
 */
export function portfolioSectionProgressRatio(
  sectionId: PortfolioMarkerSectionId,
): number {
  const index = PORTFOLIO_NAV_SECTIONS.findIndex(
    (section) => section.id === sectionId,
  )
  if (index < 0) return 0.38
  const last = Math.max(PORTFOLIO_NAV_SECTIONS.length - 1, 1)
  return Math.min(0.95, 0.2 + (index / last) * 0.72)
}
