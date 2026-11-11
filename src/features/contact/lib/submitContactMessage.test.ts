import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitContactMessage } from './submitContactMessage'

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

  it('refuses production sends when no API URL is configured', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '')
    vi.stubEnv('VITE_CONTACT_ALLOW_MOCK', '')

    const result = await submitContactMessage({
      name: 'Ruslan',
      email: 'ruslan@example.com',
      message: 'Interested in a frontend collaboration opportunity.',
    })

    expect(result).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('posts to the configured API in live mode', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '/api/contact')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
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
})
