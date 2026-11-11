/**
 * Vercel serverless contact endpoint (Resend).
 *
 * Required env (server only — never expose to Vite):
 * - RESEND_API_KEY
 * - CONTACT_FROM_EMAIL  (verified Resend sender, e.g. hello@yourdomain.com)
 * - CONTACT_TO_EMAIL    (inbox that receives portfolio inquiries)
 *
 * Optional:
 * - CONTACT_RATE_LIMIT_WINDOW_MS (default 60000)
 * - CONTACT_RATE_LIMIT_MAX (default 5)
 *
 * Deploy with Vercel so `/api/contact` is available, then set
 * `VITE_CONTACT_API_URL=/api/contact` for the frontend.
 */

type ContactBody = {
  name?: unknown
  email?: unknown
  message?: unknown
  company?: unknown
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LIMITS = { name: 120, email: 254, message: 4000 } as const

type RateBucket = { count: number; resetAt: number }
const rateBuckets = new Map<string, RateBucket>()

function readString(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function clientKey(req: { headers?: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]!.trim()
  }
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0])
  return 'unknown'
}

function allowRequest(key: string): boolean {
  const windowMs = Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS ?? 60_000)
  const max = Number(process.env.CONTACT_RATE_LIMIT_MAX ?? 5)
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= max) return false
  bucket.count += 1
  return true
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export default async function handler(
  req: {
    method?: string
    body?: ContactBody
    headers?: Record<string, string | string[] | undefined>
  },
  res: {
    status: (code: number) => { json: (body: unknown) => void }
    setHeader?: (name: string, value: string) => void
  },
) {
  res.setHeader?.('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  if (!allowRequest(clientKey(req))) {
    res.status(429).json({ ok: false, error: 'rate_limited' })
    return
  }

  const body = (req.body ?? {}) as ContactBody
  const company = readString(body.company, 200)
  // Honeypot: pretend success without sending.
  if (company) {
    res.status(200).json({ ok: true })
    return
  }

  const name = readString(body.name, LIMITS.name)
  const email = readString(body.email, LIMITS.email).toLowerCase()
  const message = readString(body.message, LIMITS.message)

  if (!name || !email || !message || message.length < 10) {
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

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
  }
}
