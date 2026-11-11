import { CONTACT_FIELD_LIMITS } from '../model/contactConfig'

export type ContactFormValues = {
  name: string
  email: string
  message: string
  /** Honeypot — must stay empty. */
  company?: string
}

export type ContactFieldErrors = Partial<
  Record<'name' | 'email' | 'message' | 'form', string>
>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeContactValues(
  values: ContactFormValues,
): ContactFormValues {
  return {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    message: values.message.trim(),
    company: values.company?.trim() ?? '',
  }
}

export function validateContactForm(
  values: ContactFormValues,
): ContactFieldErrors {
  const next = normalizeContactValues(values)
  const errors: ContactFieldErrors = {}

  if (!next.name) errors.name = 'Please enter your name.'
  else if (next.name.length > CONTACT_FIELD_LIMITS.name) {
    errors.name = `Name must be under ${CONTACT_FIELD_LIMITS.name} characters.`
  }

  if (!next.email) errors.email = 'Please enter your email.'
  else if (next.email.length > CONTACT_FIELD_LIMITS.email) {
    errors.email = 'Email is too long.'
  } else if (!EMAIL_PATTERN.test(next.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!next.message) errors.message = 'Please enter a message.'
  else if (next.message.length < 10) {
    errors.message = 'Message is a bit short — add a few more details.'
  } else if (next.message.length > CONTACT_FIELD_LIMITS.message) {
    errors.message = `Message must be under ${CONTACT_FIELD_LIMITS.message} characters.`
  }

  // Honeypot filled → treat as invalid without revealing the trap.
  if (next.company) {
    errors.form = 'Unable to send this message.'
  }

  return errors
}

export function hasContactErrors(errors: ContactFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
