import {
  findPortfolioSection,
  formatPortfolioSectionLabel,
} from '../../../app/portfolio/lib/portfolioSections'

const CONTACT_SECTION = findPortfolioSection('contact')!

/**
 * Contact section copy and verified public destinations.
 */
export const CONTACT_CONFIG = {
  sectionLabel: formatPortfolioSectionLabel(
    CONTACT_SECTION.number,
    CONTACT_SECTION.title,
  ),
  availability: 'Open to opportunities',
  headingLineOne: 'Have something',
  headingLineTwo: 'in mind?',
  description:
    "I'm interested in ambitious products, challenging engineering problems, and meaningful collaborations. Let's connect.",
  email: 'ruslan.chmyr.98@gmail.com',
  formTitle: 'Or send me a message',
  formLede: "Tell me a little about what you're working on.",
  privacyNote:
    'Your details will only be used to respond to your inquiry. Delivery uses a private email relay when configured.',
  successMessage: "Thanks for reaching out! I'll get back to you soon.",
  errorMessage:
    'Something went wrong. Please try again or contact me directly by email.',
  unavailableMessage:
    'Message delivery is not configured yet. Please email me directly.',
  copyright: '© 2026 Ruslan Chmyr',
  tagline: 'Built with care & code.',
  socials: [
    {
      id: 'github',
      label: 'GitHub',
      href: 'https://github.com/ruslan-chmyr',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/ruslan-chmyr-99419818a/',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      href: 'https://t.me/ruslanchhh',
    },
  ],
} as const

export type ContactSocial = (typeof CONTACT_CONFIG.socials)[number]

/** Max lengths enforced client + server. */
export const CONTACT_FIELD_LIMITS = {
  name: 120,
  email: 254,
  message: 4000,
} as const
