import { afterEach, describe, expect, it, vi } from 'vitest'
import {
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

  it('posts to the default API in live mode', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
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

  it('maps provider unavailability to the unavailable reason', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '/api/contact')
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitContactMessage({
      name: 'Ruslan',
      email: 'ruslan@example.com',
      message: 'Interested in a frontend collaboration opportunity.',
    })

    expect(result).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('honors an explicit API URL override', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', 'https://example.com/contact')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    await submitContactMessage({
      name: 'Ruslan',
      email: 'ruslan@example.com',
      message: 'Interested in a frontend collaboration opportunity.',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/contact',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
