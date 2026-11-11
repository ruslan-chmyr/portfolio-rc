/**
 * Experience timeline copy.
 *
 * PLACEHOLDER DATA — roles, dates, and employers below are scaffolding for
 * layout/animation work and are not verified career facts. Replace before
 * treating this section as authoritative resume content.
 */
export type ExperienceEntry = {
  period: string
  role: string
  place: string
  summary: string
}

export const EXPERIENCE_ENTRIES: readonly ExperienceEntry[] = [
  {
    period: '2022 — Present',
    role: 'Senior Frontend Engineer',
    place: 'Product & platform teams',
    summary:
      'Leading UI architecture, design-system adoption, and performance-minded React delivery across complex product surfaces.',
  },
  {
    period: '2019 — 2022',
    role: 'Frontend Engineer',
    place: 'Product engineering',
    summary:
      'Built feature-rich SPAs with TypeScript, strong accessibility habits, and measurable UX improvements.',
  },
  {
    period: '2017 — 2019',
    role: 'Web Developer',
    place: 'Agency & startup work',
    summary:
      'Shipped marketing and product interfaces end-to-end — from layout systems to interactive motion.',
  },
] as const
