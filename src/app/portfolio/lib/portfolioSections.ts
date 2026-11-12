export type PortfolioSectionId =
  | 'intro'
  | 'about'
  | 'expertise'
  | 'projects'
  | 'experience'
  | 'contact'

export type PortfolioSectionEntry = {
  id: Exclude<PortfolioSectionId, 'intro'>
  number: string
  title: string
  /** DOM id used for scroll targets (About uses heading id). */
  targetId: string
}

export type PortfolioNavMode = 'intro' | 'standard' | 'compact'

export const PORTFOLIO_CURRENT_SECTION: PortfolioSectionEntry = {
  id: 'about',
  number: '01',
  title: 'About',
  targetId: 'about-heading',
}

export function formatPortfolioSectionLabel(number: string, title: string) {
  return `${number} / ${title}`
}

/** Rows below 01 / About — single source of truth for editorial numbering. */
export const PORTFOLIO_FOLLOWING_SECTIONS: PortfolioSectionEntry[] = [
  { id: 'expertise', number: '02', title: 'Skills', targetId: 'expertise' },
  { id: 'projects', number: '03', title: 'Projects', targetId: 'projects' },
  { id: 'experience', number: '04', title: 'Experience', targetId: 'experience' },
  { id: 'contact', number: '05', title: 'Contact', targetId: 'contact' },
]

/** Navigable portfolio sections in document order (excludes intro). */
export const PORTFOLIO_NAV_SECTIONS: readonly PortfolioSectionEntry[] = [
  PORTFOLIO_CURRENT_SECTION,
  ...PORTFOLIO_FOLLOWING_SECTIONS,
]

export const PORTFOLIO_COMPACT_MAX_WIDTH_PX = 860

/** Immersive scenes that prefer compact chrome and light-on-dark marks. */
export const PORTFOLIO_IMMERSIVE_SECTIONS: ReadonlySet<PortfolioSectionId> =
  new Set(['expertise', 'projects'])

export function findPortfolioSection(
  id: PortfolioSectionId,
): PortfolioSectionEntry | undefined {
  return PORTFOLIO_NAV_SECTIONS.find((section) => section.id === id)
}
