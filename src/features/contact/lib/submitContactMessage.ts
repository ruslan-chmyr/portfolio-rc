import {
  hasContactErrors,
  normalizeContactValues,
  validateContactForm,
  type ContactFormValues,
} from './contactValidation'

export type ContactSubmitResult =
  | { ok: true; mode: 'live' | 'mock' }
  | { ok: false; reason: 'validation' | 'unavailable' | 'network' | 'server'; errors?: ReturnType<typeof validateContactForm> }

/**
 * Submission modes:
 * - live: POST to serverless `/api/contact` (Resend on Vercel)
 * - mock: local-only success for development when explicitly enabled
 * - unavailable: production-safe refusal when the API is not configured
 */
export function resolveContactSubmitMode(): 'live' | 'mock' | 'unavailable' {
  const allowMock = import.meta.env.VITE_CONTACT_ALLOW_MOCK === 'true'
  const apiUrl = String(import.meta.env.VITE_CONTACT_API_URL ?? '').trim()
  if (apiUrl) return 'live'
  if (allowMock && import.meta.env.DEV) return 'mock'
  return 'unavailable'
}

export async function submitContactMessage(
  values: ContactFormValues,
): Promise<ContactSubmitResult> {
  const normalized = normalizeContactValues(values)
  const errors = validateContactForm(normalized)
  if (hasContactErrors(errors)) {
    return { ok: false, reason: 'validation', errors }
  }

  const mode = resolveContactSubmitMode()

  if (mode === 'unavailable') {
    return { ok: false, reason: 'unavailable' }
  }

  if (mode === 'mock') {
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    return { ok: true, mode: 'mock' }
  }

  const endpoint = String(import.meta.env.VITE_CONTACT_API_URL).trim()

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: normalized.name,
        email: normalized.email,
        message: normalized.message,
        company: normalized.company ?? '',
      }),
    })

    if (!response.ok) {
      return { ok: false, reason: 'server' }
    }

    return { ok: true, mode: 'live' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
