import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  parseContactApiResponse,
  resolveContactApiUrl,
  resolveContactSubmitMode,
  submitContactMessage,
} from './submitContactMessage'

describe('submitContactMessage', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns validation failures without calling the network', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitContactMessage({
      name: '',
      email: '',
      message: '',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('validation')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('defaults to same-origin /api/contact', () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '')
    expect(resolveContactApiUrl()).toBe('/api/contact')
    expect(resolveContactSubmitMode()).toBe('live')
  })

  it('requires an explicit ok:true contract for success', () => {
    expect(parseContactApiResponse({ ok: true })).toBe(true)
    expect(parseContactApiResponse({ ok: false })).toBe(false)
    expect(parseContactApiResponse({})).toBe(false)
    expect(parseContactApiResponse(null)).toBe(false)
    expect(parseContactApiResponse('ok')).toBe(false)
  })

  it('posts to the default API in live mode', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitContactMessage({
      name: 'Ruslan',
      email: 'ruslan@example.com',
      message: 'Interested in a frontend collaboration opportunity.',
    })

    expect(result).toEqual({ ok: true, mode: 'live' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('rejects HTTP 200 with ok:false or malformed JSON', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '/api/contact')

    const falseOk = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: false, error: 'provider' }),
    })
    vi.stubGlobal('fetch', falseOk)
    expect(
      await submitContactMessage({
        name: 'Ruslan',
        email: 'ruslan@example.com',
        message: 'Interested in a frontend collaboration opportunity.',
      }),
    ).toEqual({ ok: false, reason: 'server' })

    const malformed = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json')
      },
    })
    vi.stubGlobal('fetch', malformed)
    expect(
      await submitContactMessage({
        name: 'Ruslan',
        email: 'ruslan@example.com',
        message: 'Interested in a frontend collaboration opportunity.',
      }),
    ).toEqual({ ok: false, reason: 'server' })
  })

  it('maps provider unavailability to the unavailable reason', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '/api/contact')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ ok: false, error: 'unavailable' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitContactMessage({
      name: 'Ruslan',
      email: 'ruslan@example.com',
      message: 'Interested in a frontend collaboration opportunity.',
    })

    expect(result).toEqual({ ok: false, reason: 'unavailable' })
  })
})
