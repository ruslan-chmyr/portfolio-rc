export { PortfolioNav } from './components/PortfolioNav'
export {
  PortfolioActiveSectionMarker,
  type PortfolioActiveSectionMarkerOrientation,
  type PortfolioActiveSectionMarkerProps,
} from './components/PortfolioActiveSectionMarker'
export { PortfolioSectionIndex } from './components/PortfolioSectionIndex'
export {
  formatPortfolioSectionLabel,
  PORTFOLIO_CURRENT_SECTION,
  PORTFOLIO_FOLLOWING_SECTIONS,
  PORTFOLIO_NAV_SECTIONS,
  type PortfolioNavMode,
  type PortfolioSectionId,
} from './lib/portfolioSections'
export {
  portfolioSectionProgressRatio,
  type PortfolioMarkerSectionId,
} from './lib/portfolioSectionProgress'
export { detectActivePortfolioSection } from './lib/detectActivePortfolioSection'
export { resolvePortfolioNavMode } from './lib/resolvePortfolioNavMode'
export {
  navigatePortfolioSection,
  PORTFOLIO_NAVIGATE_EVENT,
} from './lib/navigatePortfolioSection'
export {
  beginPortfolioNavSession,
  endPortfolioNavSession,
  isPortfolioNavSessionActive,
} from './lib/portfolioNavSession'
