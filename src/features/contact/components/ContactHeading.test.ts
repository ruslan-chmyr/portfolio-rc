/** @vitest-environment jsdom */
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ContactHeading } from './ContactHeading'
import { CONTACT_CONFIG } from '../model/contactConfig'

vi.mock('../lib/createGravityLettersFallback', () => ({
  createGravityLettersFallback: () => ({
    setEnabled: vi.fn(),
    dispose: vi.fn(),
  }),
}))

describe('ContactHeading', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it('exposes a single accessible name without duplicated gravity text', () => {
    act(() => {
      root.render(createElement(ContactHeading))
    })

    const heading = container.querySelector('#contact-heading')
    expect(heading).not.toBeNull()
    expect(heading?.getAttribute('aria-label')).toBe(
      `${CONTACT_CONFIG.headingLineOne} ${CONTACT_CONFIG.headingLineTwo}`,
    )
    expect(heading?.querySelector('.visually-hidden')).toBeNull()
    expect(
      heading?.querySelector('.contact-heading__line')?.getAttribute('aria-hidden'),
    ).toBe('true')
  })
})
