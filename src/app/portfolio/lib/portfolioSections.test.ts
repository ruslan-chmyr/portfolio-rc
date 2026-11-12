import { describe, expect, it } from 'vitest'
import {
  formatPortfolioSectionLabel,
  PORTFOLIO_FOLLOWING_SECTIONS,
  PORTFOLIO_NAV_SECTIONS,
} from './portfolioSections'

describe('portfolio section numbering', () => {
  it('uses contiguous 01–05 editorial numbers across the registry', () => {
    expect(PORTFOLIO_NAV_SECTIONS.map((section) => section.number)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
    ])
    expect(PORTFOLIO_NAV_SECTIONS.map((section) => section.id)).toEqual([
      'about',
      'expertise',
      'projects',
      'experience',
      'contact',
    ])
  })

  it('keeps following-section numbers aligned with the full nav list', () => {
    expect(PORTFOLIO_FOLLOWING_SECTIONS.map((section) => section.number)).toEqual(
      ['02', '03', '04', '05'],
    )
    expect(
      formatPortfolioSectionLabel(
        PORTFOLIO_FOLLOWING_SECTIONS[2]!.number,
        PORTFOLIO_FOLLOWING_SECTIONS[2]!.title,
      ),
    ).toBe('04 / Experience')
    expect(
      formatPortfolioSectionLabel(
        PORTFOLIO_FOLLOWING_SECTIONS[3]!.number,
        PORTFOLIO_FOLLOWING_SECTIONS[3]!.title,
      ),
    ).toBe('05 / Contact')
  })
})
