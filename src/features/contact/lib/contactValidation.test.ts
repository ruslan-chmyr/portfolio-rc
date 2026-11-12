import { describe, expect, it } from 'vitest'
import {
  hasContactErrors,
  normalizeContactValues,
  validateContactForm,
} from './contactValidation'

describe('contactValidation', () => {
  it('accepts a complete message', () => {
    const errors = validateContactForm({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Looking to collaborate on a product UI system.',
    })
    expect(hasContactErrors(errors)).toBe(false)
  })

  it('flags missing and invalid fields', () => {
    const errors = validateContactForm({
      name: '',
      email: 'not-an-email',
      message: 'short',
    })
    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.message).toBeTruthy()
  })

  it('rejects honeypot submissions quietly', () => {
    const errors = validateContactForm({
      name: 'Bot',
      email: 'bot@example.com',
      message: 'A sufficiently long automated message body.',
      company: 'spam-corp',
    })
    expect(errors.form).toBeTruthy()
  })

  it('normalizes email casing and whitespace', () => {
    expect(
      normalizeContactValues({
        name: '  Ruslan  ',
        email: '  Ruslan@Example.COM ',
        message: '  Hello there, collaboration idea.  ',
      }),
    ).toEqual({
      name: 'Ruslan',
      email: 'ruslan@example.com',
      message: 'Hello there, collaboration idea.',
      company: '',
    })
  })
})
