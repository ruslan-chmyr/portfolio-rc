import { describe, expect, it } from 'vitest'
import {
  EXPERIENCE_CV_PDF_URL,
  EXPERIENCE_ENTRIES,
  getExperienceYears,
  isExperienceCvPdfConfigured,
} from './experienceConfig'

describe('experienceConfig', () => {
  it('exposes four reverse-chronological career entries', () => {
    expect(EXPERIENCE_ENTRIES).toHaveLength(4)
    expect(EXPERIENCE_ENTRIES.map((entry) => entry.role)).toEqual([
      'Senior Frontend Engineer',
      'Frontend Engineer',
      'Frontend Engineer',
      'Frontend Developer',
    ])
    expect(EXPERIENCE_ENTRIES.map((entry) => entry.organization)).toEqual([
      'Product Engineering · Confidential',
      'Mindtech Studio',
      'Titanium Technologies',
      'Axels',
    ])
    expect(EXPERIENCE_ENTRIES.map((entry) => entry.period)).toEqual([
      'Mar 2026 – Present',
      'Feb 2023 – Mar 2026',
      'Nov 2020 – Feb 2023',
      'Aug 2019 – Nov 2020',
    ])
  })

  it('keeps stable ids and required card fields', () => {
    const ids = EXPERIENCE_ENTRIES.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const entry of EXPERIENCE_ENTRIES) {
      expect(entry.year).toMatch(/^\d{4}$/)
      expect(entry.dateTime).toMatch(/^\d{4}-\d{2}$/)
      expect(entry.role.length).toBeGreaterThan(0)
      expect(entry.organization.length).toBeGreaterThan(0)
      expect(entry.summary.length).toBeGreaterThan(40)
      expect(entry.tags?.length).toBeGreaterThan(0)
    }
  })

  it('uses the confidential public label and never exposes Brain Rocket', () => {
    const serialized = JSON.stringify(EXPERIENCE_ENTRIES)
    expect(serialized.toLowerCase()).not.toContain('brain rocket')
    expect(EXPERIENCE_ENTRIES[0]?.organization).toBe(
      'Product Engineering · Confidential',
    )
  })

  it('derives year labels from entry data', () => {
    expect(getExperienceYears()).toEqual(['2026', '2023', '2020', '2019'])
  })

  it('keeps an unset Resume PDF URL by default', () => {
    expect(EXPERIENCE_CV_PDF_URL).toBe('')
    expect(isExperienceCvPdfConfigured()).toBe(false)
    expect(isExperienceCvPdfConfigured('https://example.com/cv.pdf')).toBe(true)
    expect(isExperienceCvPdfConfigured('   ')).toBe(false)
  })
})
