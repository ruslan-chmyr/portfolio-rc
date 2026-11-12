import {
  PORTFOLIO_COMPACT_MAX_WIDTH_PX,
  PORTFOLIO_IMMERSIVE_SECTIONS,
  type PortfolioNavMode,
  type PortfolioSectionId,
} from './portfolioSections'

export type ResolvePortfolioNavModeInput = {
  nativeScroll: boolean
  activeSection: PortfolioSectionId
  viewportWidth: number
}

/**
 * Mode A — intro capture (minimal; IntroHeader owns chrome).
 * Mode B — standard portfolio chrome.
 * Mode C — compact chrome for immersive / narrow viewports.
 */
export function resolvePortfolioNavMode(
  input: ResolvePortfolioNavModeInput,
): PortfolioNavMode {
  if (!input.nativeScroll) return 'intro'
  if (
    input.viewportWidth <= PORTFOLIO_COMPACT_MAX_WIDTH_PX ||
    PORTFOLIO_IMMERSIVE_SECTIONS.has(input.activeSection)
  ) {
    return 'compact'
  }
  return 'standard'
}

export function portfolioChromeSurface(
  activeSection: PortfolioSectionId,
): 'intro' | 'portfolio' | 'immersive' {
  if (activeSection === 'intro') return 'intro'
  if (PORTFOLIO_IMMERSIVE_SECTIONS.has(activeSection)) return 'immersive'
  return 'portfolio'
}
