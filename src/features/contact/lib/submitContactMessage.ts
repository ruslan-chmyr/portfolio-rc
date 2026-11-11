import {
  hasContactErrors,
  normalizeContactValues,
  validateContactForm,
  type ContactFormValues,
} from './contactValidation'

export type ContactSubmitResult =
  | { ok: true; mode: 'live' | 'mock' }
  | {
      ok: false
      reason: 'validation' | 'unavailable' | 'network' | 'server'
      errors?: ReturnType<typeof validateContactForm>
    }

const DEFAULT_CONTACT_API_URL = '/api/contact'

/**
 * Submission modes:
 * - live: POST to serverless contact API (Resend on Vercel)
 * - mock: local-only success for development when explicitly enabled
 * - unavailable: production-safe refusal when mock is off and caller opts out
 *
 * A configured endpoint URL does not prove email delivery works — the API may
 * still return 503 when Resend credentials are missing.
 */
export function resolveContactApiUrl(): string {
  const configured = String(import.meta.env.VITE_CONTACT_API_URL ?? '').trim()
  return configured || DEFAULT_CONTACT_API_URL
}

export function resolveContactSubmitMode(): 'live' | 'mock' | 'unavailable' {
  const allowMock = import.meta.env.VITE_CONTACT_ALLOW_MOCK === 'true'
  // Prefer same-origin `/api/contact` in all environments; mock only when asked.
  if (allowMock && import.meta.env.DEV && !String(import.meta.env.VITE_CONTACT_API_URL ?? '').trim()) {
    return 'mock'
  }
  return 'live'
}

export async function submitContactMessage(
  values: ContactFormValues,
  options?: { signal?: AbortSignal },
): Promise<ContactSubmitResult> {
  const normalized = normalizeContactValues(values)
  const errors = validateContactForm(normalized)
  if (hasContactErrors(errors)) {
    return { ok: false, reason: 'validation', errors }
  }

  const mode = resolveContactSubmitMode()

  if (mode === 'mock') {
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    return { ok: true, mode: 'mock' }
  }

  const endpoint = resolveContactApiUrl()

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: options?.signal,
      body: JSON.stringify({
        name: normalized.name,
        email: normalized.email,
        message: normalized.message,
        company: normalized.company ?? '',
      }),
    })

    if (response.status === 503) {
      return { ok: false, reason: 'unavailable' }
    }

    if (!response.ok) {
      return { ok: false, reason: 'server' }
    }

    return { ok: true, mode: 'live' }
  } catch (error) {
    if (options?.signal?.aborted) {
      return { ok: false, reason: 'network' }
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, reason: 'network' }
    }
    return { ok: false, reason: 'network' }
  }
}
