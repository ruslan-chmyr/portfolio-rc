import {
  PORTFOLIO_COMPACT_MAX_WIDTH_PX,
  PORTFOLIO_IMMERSIVE_SECTIONS,
  PORTFOLIO_RAIL_SECTIONS,
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
 * Mode B — standard horizontal portfolio chrome (About).
 * Mode C — compact chrome for immersive / narrow viewports.
 * Mode D — vertical left rail for desktop Skills / Projects / Experience / Contact.
 */
export function resolvePortfolioNavMode(
  input: ResolvePortfolioNavModeInput,
): PortfolioNavMode {
  if (!input.nativeScroll) return 'intro'
  if (input.viewportWidth <= PORTFOLIO_COMPACT_MAX_WIDTH_PX) return 'compact'
  if (PORTFOLIO_RAIL_SECTIONS.has(input.activeSection)) return 'rail'
  if (PORTFOLIO_IMMERSIVE_SECTIONS.has(input.activeSection)) return 'compact'
  return 'standard'
}

export function portfolioChromeSurface(
  activeSection: PortfolioSectionId,
): 'intro' | 'portfolio' | 'immersive' {
  if (activeSection === 'intro') return 'intro'
  if (PORTFOLIO_IMMERSIVE_SECTIONS.has(activeSection)) return 'immersive'
  return 'portfolio'
}
