/**
 * Vercel serverless contact endpoint (Resend).
 *
 * Required env (server only — never use VITE_ for these):
 * - RESEND_API_KEY
 * - CONTACT_FROM_EMAIL  (verified Resend sender)
 * - CONTACT_TO_EMAIL    (inbox that receives inquiries)
 *
 * Optional:
 * - CONTACT_RATE_LIMIT_WINDOW_MS (default 60000)
 * - CONTACT_RATE_LIMIT_MAX (default 5)
 * - CONTACT_RESEND_TIMEOUT_MS (default 10000)
 *
 * Abuse protection:
 * - Per-instance soft limiter (defense in depth; not global across serverless isolates).
 * - Production MUST also enable Vercel Firewall / WAF rate limiting on POST /api/contact.
 * - Client identity prefers Vercel-set headers (`x-vercel-forwarded-for`, then `x-real-ip`).
 * - Do not treat arbitrary `x-forwarded-for` as authoritative outside Vercel.
 *
 * Frontend defaults to same-origin `/api/contact` (override with VITE_CONTACT_API_URL only if needed).
 */

export type ContactBody = {
  name?: unknown
  email?: unknown
  message?: unknown
  company?: unknown
}

export type ContactRequest = {
  method?: string
  body?: ContactBody | string | null
  headers?: Record<string, string | string[] | undefined>
}

export type ContactResponse = {
  status: (code: number) => { json: (body: unknown) => void }
  setHeader?: (name: string, value: string) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const CONTACT_LIMITS = { name: 120, email: 254, message: 4000 } as const
export const CONTACT_MAX_BODY_BYTES = 12_000

type RateBucket = { count: number; resetAt: number }

/** Dev / per-isolate soft limit only — not a global production control. */
const rateBuckets = new Map<string, RateBucket>()
const RATE_BUCKET_CAP = 2_000

export function resetContactRateLimitStateForTests(): void {
  rateBuckets.clear()
}

function headerValue(
  headers: ContactRequest['headers'],
  name: string,
): string {
  const raw = headers?.[name] ?? headers?.[name.toLowerCase()]
  if (typeof raw === 'string') return raw.trim()
  if (Array.isArray(raw) && raw[0]) return String(raw[0]).trim()
  return ''
}

/**
 * Prefer platform-controlled identity. On Vercel, `x-vercel-forwarded-for`
 * / `x-real-ip` are set by the edge. Generic `x-forwarded-for` is only used
 * as a last resort and may be spoofable outside that contract.
 */
export function resolveClientKey(req: ContactRequest): string {
  const vercelForwarded = headerValue(req.headers, 'x-vercel-forwarded-for')
  if (vercelForwarded) return vercelForwarded.split(',')[0]!.trim() || 'unknown'

  const realIp = headerValue(req.headers, 'x-real-ip')
  if (realIp) return realIp

  const forwarded = headerValue(req.headers, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim() || 'unknown'

  return 'unknown'
}

function pruneRateBuckets(now: number): void {
  for (const [key, bucket] of rateBuckets) {
    if (now > bucket.resetAt) rateBuckets.delete(key)
  }
  if (rateBuckets.size <= RATE_BUCKET_CAP) return
  // Drop oldest reset windows first under pressure.
  const ordered = [...rateBuckets.entries()].sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  )
  const overflow = rateBuckets.size - RATE_BUCKET_CAP
  for (let i = 0; i < overflow; i += 1) {
    const key = ordered[i]?.[0]
    if (key) rateBuckets.delete(key)
  }
}

/** Soft per-isolate limiter. Returns false when the caller should receive 429. */
export function allowContactRequest(
  key: string,
  now = Date.now(),
): boolean {
  const windowMs = Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS ?? 60_000)
  const max = Number(process.env.CONTACT_RATE_LIMIT_MAX ?? 5)
  pruneRateBuckets(now)
  const bucket = rateBuckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= max) return false
  bucket.count += 1
  return true
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

type ParsedField =
  | { ok: true; value: string }
  | { ok: false; reason: 'missing' | 'too_large' | 'type' }

function readBoundedString(value: unknown, max: number): ParsedField {
  if (typeof value !== 'string') return { ok: false, reason: 'type' }
  const trimmed = value.trim()
  if (trimmed.length > max) return { ok: false, reason: 'too_large' }
  return { ok: true, value: trimmed }
}

function parseBody(raw: ContactRequest['body']): ContactBody | null {
  if (raw == null) return {}
  if (typeof raw === 'object') return raw as ContactBody
  if (typeof raw === 'string') {
    if (raw.length > CONTACT_MAX_BODY_BYTES) return null
    try {
      return JSON.parse(raw) as ContactBody
    } catch {
      return null
    }
  }
  return null
}

function isJsonContentType(req: ContactRequest): boolean {
  const contentType = headerValue(req.headers, 'content-type').toLowerCase()
  if (!contentType) return true // Vercel may pre-parse without forwarding CT in tests
  return contentType.includes('application/json')
}

export type ContactHandlerDeps = {
  fetchImpl?: typeof fetch
  now?: () => number
}

export async function handleContactRequest(
  req: ContactRequest,
  res: ContactResponse,
  deps: ContactHandlerDeps = {},
): Promise<void> {
  const fetchImpl = deps.fetchImpl ?? fetch
  const now = deps.now ?? Date.now

  res.setHeader?.('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  if (!isJsonContentType(req)) {
    res.status(415).json({ ok: false, error: 'unsupported_media_type' })
    return
  }

  if (!allowContactRequest(resolveClientKey(req), now())) {
    res.status(429).json({ ok: false, error: 'rate_limited' })
    return
  }

  const body = parseBody(req.body)
  if (!body) {
    res.status(400).json({ ok: false, error: 'validation' })
    return
  }

  const companyField = readBoundedString(body.company ?? '', 200)
  if (!companyField.ok && companyField.reason === 'too_large') {
    res.status(400).json({ ok: false, error: 'validation' })
    return
  }
  // Honeypot: pretend success without sending or storing content.
  if (companyField.ok && companyField.value) {
    res.status(200).json({ ok: true })
    return
  }

  const nameField = readBoundedString(body.name, CONTACT_LIMITS.name)
  const emailField = readBoundedString(body.email, CONTACT_LIMITS.email)
  const messageField = readBoundedString(body.message, CONTACT_LIMITS.message)

  if (!nameField.ok || !emailField.ok || !messageField.ok) {
    res.status(400).json({ ok: false, error: 'validation' })
    return
  }

  const name = nameField.value
  const email = emailField.value.toLowerCase()
  const message = messageField.value

  if (!name || !email || message.length < 10) {
    res.status(400).json({ ok: false, error: 'validation' })
    return
  }
  if (!EMAIL_PATTERN.test(email) || email.includes('\n') || email.includes('\r')) {
    res.status(400).json({ ok: false, error: 'validation' })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL
  const to = process.env.CONTACT_TO_EMAIL

  if (!apiKey || !from || !to) {
    res.status(503).json({ ok: false, error: 'unavailable' })
    return
  }

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeMessage = escapeHtml(message).replaceAll('\n', '<br />')
  const timeoutMs = Number(process.env.CONTACT_RESEND_TIMEOUT_MS ?? 10_000)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Portfolio inquiry from ${name}`.slice(0, 120),
        html: `<p><strong>Name:</strong> ${safeName}</p>
<p><strong>Email:</strong> ${safeEmail}</p>
<p><strong>Message:</strong></p>
<p>${safeMessage}</p>`,
      }),
    })

    if (!response.ok) {
      res.status(502).json({ ok: false, error: 'provider' })
      return
    }

    res.status(200).json({ ok: true })
  } catch {
    res.status(502).json({ ok: false, error: 'provider' })
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(
  req: ContactRequest,
  res: ContactResponse,
): Promise<void> {
  await handleContactRequest(req, res)
}
