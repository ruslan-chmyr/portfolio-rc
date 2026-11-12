import { describe, expect, it } from 'vitest'
import { CONTACT_CONFIG, CONTACT_FIELD_LIMITS } from './contactConfig'

describe('contactConfig', () => {
  it('exposes verified contact destinations', () => {
    expect(CONTACT_CONFIG.sectionLabel).toBe('05 / Contact')
    expect(CONTACT_CONFIG.email).toBe('ruslan.chmyr.98@gmail.com')
    expect(CONTACT_CONFIG.availability).toBe('Open to opportunities')
    expect(CONTACT_CONFIG.socials).toEqual([
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
    ])
  })

  it('does not mark socials as demo placeholders', () => {
    for (const social of CONTACT_CONFIG.socials) {
      expect(social).not.toHaveProperty('placeholder')
      expect(social.label.toLowerCase()).not.toContain('demo')
      expect(social.href.toLowerCase()).not.toContain('demo')
    }
  })

  it('keeps conservative field limits', () => {
    expect(CONTACT_FIELD_LIMITS.name).toBeGreaterThan(0)
    expect(CONTACT_FIELD_LIMITS.email).toBeGreaterThan(0)
    expect(CONTACT_FIELD_LIMITS.message).toBeGreaterThan(100)
  })
})
