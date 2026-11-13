import { describe, expect, it } from 'vitest'
import { portfolioSectionProgressRatio } from './portfolioSectionProgress'

describe('portfolioSectionProgressRatio', () => {
  it('increases along the registry order', () => {
    const about = portfolioSectionProgressRatio('about')
    const expertise = portfolioSectionProgressRatio('expertise')
    const projects = portfolioSectionProgressRatio('projects')
    const experience = portfolioSectionProgressRatio('experience')
    const contact = portfolioSectionProgressRatio('contact')

    expect(about).toBeLessThan(expertise)
    expect(expertise).toBeLessThan(projects)
    expect(projects).toBeLessThan(experience)
    expect(experience).toBeLessThan(contact)
    expect(contact).toBeLessThanOrEqual(0.95)
  })

  it('keeps Skills/Projects near the prior rail fill band', () => {
    expect(portfolioSectionProgressRatio('expertise')).toBeCloseTo(0.38, 2)
    expect(portfolioSectionProgressRatio('projects')).toBeCloseTo(0.56, 2)
  })
})
