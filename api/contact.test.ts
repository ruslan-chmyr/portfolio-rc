import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  allowContactRequest,
  escapeHtml,
  handleContactRequest,
  resetContactRateLimitStateForTests,
  resolveClientKey,
  type ContactRequest,
  type ContactResponse,
} from './contact'

function createRes() {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  const setHeader = vi.fn()
  const res: ContactResponse = { status, setHeader }
  return { res, status, json, setHeader }
}

function baseReq(overrides: Partial<ContactRequest> = {}): ContactRequest {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-vercel-forwarded-for': '203.0.113.10',
    },
    body: {
      name: 'Ruslan',
      email: 'ruslan@example.com',
      message: 'Interested in a frontend collaboration opportunity.',
      company: '',
    },
    ...overrides,
  }
}

describe('contact API', () => {
  beforeEach(() => {
    resetContactRateLimitStateForTests()
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('CONTACT_FROM_EMAIL', 'hello@example.com')
    vi.stubEnv('CONTACT_TO_EMAIL', 'me@example.com')
    vi.stubEnv('CONTACT_RATE_LIMIT_MAX', '3')
    vi.stubEnv('CONTACT_RATE_LIMIT_WINDOW_MS', '60000')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    resetContactRateLimitStateForTests()
  })

  it('rejects unsupported methods with 405', async () => {
    const { res, status, json } = createRes()
    await handleContactRequest(baseReq({ method: 'GET' }), res)
    expect(status).toHaveBeenCalledWith(405)
    expect(json).toHaveBeenCalledWith({ ok: false, error: 'method_not_allowed' })
  })

  it('rejects malformed JSON payloads', async () => {
    const { res, status } = createRes()
    await handleContactRequest(baseReq({ body: '{not-json' }), res)
    expect(status).toHaveBeenCalledWith(400)
  })

  it('rejects invalid email and header-injection attempts', async () => {
    const { res, status } = createRes()
    await handleContactRequest(
      baseReq({
        body: {
          name: 'Ruslan',
          email: 'not-an-email',
          message: 'Interested in a frontend collaboration opportunity.',
        },
      }),
      res,
    )
    expect(status).toHaveBeenCalledWith(400)

    const injected = createRes()
    await handleContactRequest(
      baseReq({
        body: {
          name: 'Ruslan',
          email: 'evil@example.com\nBcc: leak@example.com',
          message: 'Interested in a frontend collaboration opportunity.',
        },
      }),
      injected.res,
    )
    expect(injected.status).toHaveBeenCalledWith(400)
  })

  it('rejects oversized fields instead of truncating', async () => {
    const { res, status } = createRes()
    await handleContactRequest(
      baseReq({
        body: {
          name: 'x'.repeat(121),
          email: 'ruslan@example.com',
          message: 'Interested in a frontend collaboration opportunity.',
        },
      }),
      res,
    )
    expect(status).toHaveBeenCalledWith(400)
  })

  it('honeypot returns success without calling the provider', async () => {
    const fetchImpl = vi.fn()
    const { res, status, json } = createRes()
    await handleContactRequest(
      baseReq({
        body: {
          name: 'Bot',
          email: 'bot@example.com',
          message: 'Interested in a frontend collaboration opportunity.',
          company: 'Acme Spam',
        },
      }),
      res,
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ ok: true })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns 429 when the soft rate limit is exceeded', async () => {
    const key = '203.0.113.10'
    expect(allowContactRequest(key)).toBe(true)
    expect(allowContactRequest(key)).toBe(true)
    expect(allowContactRequest(key)).toBe(true)
    expect(allowContactRequest(key)).toBe(false)

    const fetchImpl = vi.fn()
    const { res, status } = createRes()
    await handleContactRequest(baseReq(), res, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(status).toHaveBeenCalledWith(429)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('prefers Vercel-controlled client identity headers', () => {
    expect(
      resolveClientKey({
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'x-vercel-forwarded-for': '9.9.9.9',
        },
      }),
    ).toBe('9.9.9.9')
  })

  it('returns 503 when provider credentials are missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const fetchImpl = vi.fn()
    const { res, status } = createRes()
    await handleContactRequest(baseReq(), res, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(status).toHaveBeenCalledWith(503)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns 502 on provider failure without leaking secrets', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const { res, status, json } = createRes()
    await handleContactRequest(baseReq(), res, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(status).toHaveBeenCalledWith(502)
    expect(json).toHaveBeenCalledWith({ ok: false, error: 'provider' })
    const payload = JSON.stringify(json.mock.calls[0]?.[0])
    expect(payload).not.toContain('test-key')
  })

  it('returns 502 when the provider times out', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn().mockImplementation((_url, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(new Error('aborted'))
        })
      })
    })
    vi.stubEnv('CONTACT_RESEND_TIMEOUT_MS', '1000')
    const { res, status } = createRes()
    const pending = handleContactRequest(baseReq(), res, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    await vi.advanceTimersByTimeAsync(1000)
    await pending
    expect(status).toHaveBeenCalledWith(502)
    vi.useRealTimers()
  })

  it('sends escaped HTML and reply_to on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 're_123' }),
    })
    const { res, status, json } = createRes()
    await handleContactRequest(
      baseReq({
        body: {
          name: 'Ruslan <script>',
          email: 'ruslan@example.com',
          message: 'Interested in a frontend collaboration opportunity.',
        },
      }),
      res,
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ ok: true })
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(init.body)) as {
      reply_to: string
      html: string
    }
    expect(body.reply_to).toBe('ruslan@example.com')
    expect(body.html).toContain(escapeHtml('Ruslan <script>'))
    expect(body.html).not.toContain('<script>')
    expect(String(init.headers)).not.toContain('VITE_')
  })

  it('rejects provider 200 payloads without an acceptance id', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    const { res, status } = createRes()
    await handleContactRequest(baseReq(), res, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(status).toHaveBeenCalledWith(502)
  })

  it('rejects arrays and primitives as request bodies', async () => {
    const arrayRes = createRes()
    await handleContactRequest(baseReq({ body: '[]' }), arrayRes.res)
    expect(arrayRes.status).toHaveBeenCalledWith(400)

    const primitiveRes = createRes()
    await handleContactRequest(baseReq({ body: '"hello"' }), primitiveRes.res)
    expect(primitiveRes.status).toHaveBeenCalledWith(400)
  })

  it('requires JSON content-type', async () => {
    const { res, status } = createRes()
    await handleContactRequest(
      baseReq({ headers: { 'x-vercel-forwarded-for': '203.0.113.10' } }),
      res,
    )
    expect(status).toHaveBeenCalledWith(415)
  })

  it('falls back safely from invalid rate-limit env values', async () => {
    vi.stubEnv('CONTACT_RATE_LIMIT_MAX', 'NaN')
    vi.stubEnv('CONTACT_RATE_LIMIT_WINDOW_MS', '-5')
    const { readPositiveIntEnv } = await import('./contact')
    expect(readPositiveIntEnv('CONTACT_RATE_LIMIT_MAX', 5, { min: 1, max: 100 })).toBe(
      5,
    )
    expect(
      readPositiveIntEnv('CONTACT_RATE_LIMIT_WINDOW_MS', 60_000, {
        min: 1_000,
        max: 3_600_000,
      }),
    ).toBe(60_000)
  })
})
