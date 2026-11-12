export type PortfolioSectionEntry = {
  id: string
  number: string
  title: string
}

export const PORTFOLIO_CURRENT_SECTION: PortfolioSectionEntry = {
  id: 'about',
  number: '01',
  title: 'About',
}

export function formatPortfolioSectionLabel(number: string, title: string) {
  return `${number} / ${title}`
}

/** Rows below 01 / About */
export const PORTFOLIO_FOLLOWING_SECTIONS: PortfolioSectionEntry[] = [
  { id: 'expertise', number: '02', title: 'Skills' },
  { id: 'projects', number: '03', title: 'Projects' },
  { id: 'experience', number: '04', title: 'Experience' },
  { id: 'contact', number: '06', title: 'Contact' },
]
