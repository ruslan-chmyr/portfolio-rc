import { describe, expect, it } from 'vitest'
import { detectActivePortfolioSection } from './detectActivePortfolioSection'

describe('detectActivePortfolioSection', () => {
  it('reports intro when native scroll is off', () => {
    expect(
      detectActivePortfolioSection({
        nativeScroll: false,
        sectionTops: { about: 0 },
      }),
    ).toBe('intro')
  })

  it('prefers projects scene ownership over skills geometry', () => {
    expect(
      detectActivePortfolioSection({
        nativeScroll: true,
        projectsSceneActive: true,
        skillsHandoffPhase: 'settled',
        sectionTops: {
          about: -800,
          expertise: 0,
          projects: 0,
          experience: 900,
          contact: 1600,
        },
      }),
    ).toBe('projects')
  })

  it('uses skills handoff settled phase before geometry', () => {
    expect(
      detectActivePortfolioSection({
        nativeScroll: true,
        projectsSceneActive: false,
        skillsHandoffPhase: 'settled',
        sectionTops: {
          about: -400,
          expertise: 0,
          projects: 800,
          experience: 1600,
          contact: 2400,
        },
      }),
    ).toBe('expertise')
  })

  it('treats aligning-skills as expertise for immersive chrome timing', () => {
    expect(
      detectActivePortfolioSection({
        nativeScroll: true,
        projectsSceneActive: false,
        skillsHandoffPhase: 'aligning-skills',
        sectionTops: {
          about: -200,
          expertise: 120,
          projects: 900,
          experience: 1600,
          contact: 2400,
        },
      }),
    ).toBe('expertise')
  })

  it('picks the deepest section whose top crossed the probe', () => {
    expect(
      detectActivePortfolioSection({
        nativeScroll: true,
        projectsSceneActive: false,
        skillsHandoffPhase: 'passed',
        viewportHeight: 1000,
        sectionTops: {
          about: -2000,
          expertise: -1200,
          projects: -800,
          experience: 100,
          contact: 900,
        },
      }),
    ).toBe('experience')
  })
})
