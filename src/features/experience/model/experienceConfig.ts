/**
 * Experience timeline copy and CV call-to-action configuration.
 *
 * Career entries are reverse-chronological. The current employer is published
 * only as a confidential public-facing label — never expose the private
 * company name in this feature.
 */
export type ExperienceEntry = {
  id: string
  /** Display year for the sticky/year indicator (derived from the period). */
  year: string
  /** Machine-readable start for <time dateTime>, e.g. 2026-03. */
  dateTime: string
  period: string
  role: string
  organization: string
  summary: string
  tags?: readonly string[]
}

export const EXPERIENCE_ENTRIES: readonly ExperienceEntry[] = [
  {
    id: 'senior-fe-current',
    year: '2026',
    dateTime: '2026-03',
    period: 'Mar 2026 – Present',
    role: 'Senior Frontend Engineer',
    organization: 'Product Engineering · Confidential',
    summary:
      'Focused on building complex Back Office interfaces and designing scalable frontend architecture across web and mobile applications. Architected a shared JavaScript foundation powering 10+ interactive widgets, improved consistency and reusability across products, and contributed to automated testing, CI/CD workflows, and cross-team technical decisions.',
    tags: ['React', 'JavaScript', 'TypeScript', 'System Design', 'Nx', 'CI/CD'],
  },
  {
    id: 'mindtech-studio',
    year: '2023',
    dateTime: '2023-02',
    period: 'Feb 2023 – Mar 2026',
    role: 'Frontend Engineer',
    organization: 'Mindtech Studio',
    summary:
      'Worked across multiple product environments, taking ownership of frontend development from architecture to delivery. Built configurable React and Next.js applications, optimized complex data-heavy interfaces, and developed AI-powered automation workflows through integrations with LLMs, GitHub, and external services.',
    tags: ['React', 'Next.js', 'TypeScript', 'Performance', 'AI Automation'],
  },
  {
    id: 'titanium-technologies',
    year: '2020',
    dateTime: '2020-11',
    period: 'Nov 2020 – Feb 2023',
    role: 'Frontend Engineer',
    organization: 'Titanium Technologies',
    summary:
      'Developed interactive web and mobile applications, including Web3 platforms, administrative dashboards, and communication tools. Worked with microfrontend architecture, reusable component systems, and cross-platform development, gaining experience in building maintainable applications across different products.',
    tags: ['React', 'TypeScript', 'Module Federation', 'React Native'],
  },
  {
    id: 'axels',
    year: '2019',
    dateTime: '2019-08',
    period: 'Aug 2019 – Nov 2020',
    role: 'Frontend Developer',
    organization: 'Axels',
    summary:
      'Started my professional journey building and modernizing web applications with JavaScript and React. Migrated legacy interfaces to modern frontend architecture, developed internal business tools, and created reusable UI components that integrated with existing applications.',
    tags: ['React', 'JavaScript', 'UI Development'],
  },
] as const

/**
 * Public PDF for “View Full CV”.
 * Leave empty until a hosted PDF path is available.
 * Do not point this at an editable Google Docs URL.
 */
export const EXPERIENCE_CV_PDF_URL = '' as const

export const EXPERIENCE_CV_CTA = {
  description: 'Explore more in my CV',
  buttonLabel: 'View Full CV',
} as const

export function getExperienceYears(
  entries: readonly ExperienceEntry[] = EXPERIENCE_ENTRIES,
): readonly string[] {
  return entries.map((entry) => entry.year)
}

export function isExperienceCvPdfConfigured(
  url: string = EXPERIENCE_CV_PDF_URL,
): boolean {
  return url.trim().length > 0
}
