/** @vitest-environment jsdom */
import { createElement, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTACT_CONFIG } from '../model/contactConfig'
import { ContactLinks } from './ContactLinks'

describe('ContactLinks', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
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

  it('renders verified email, availability-free socials, and secure external attrs', () => {
    act(() => {
      root.render(createElement(ContactLinks))
    })

    const email = container.querySelector(
      `a.contact-links__email[href="mailto:${CONTACT_CONFIG.email}"]`,
    )
    expect(email?.textContent).toBe(CONTACT_CONFIG.email)

    const socialLinks = [...container.querySelectorAll('a.contact-links__social')]
    expect(socialLinks).toHaveLength(3)

    for (const [index, social] of CONTACT_CONFIG.socials.entries()) {
      const link = socialLinks[index]
      expect(link.getAttribute('href')).toBe(social.href)
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
      expect(link.getAttribute('aria-label')).toBe(
        `${social.label} (opens in a new tab)`,
      )
      expect(link.textContent?.toLowerCase()).not.toContain('demo')
      expect(link.hasAttribute('data-placeholder')).toBe(false)

      const icon = link.querySelector(
        `img.contact-links__social-icon[data-social="${social.id}"]`,
      )
      expect(icon).not.toBeNull()
      expect(icon?.getAttribute('alt')).toBe('')
      expect(icon?.getAttribute('src')).toBeTruthy()
    }

    expect(container.textContent?.toLowerCase()).not.toContain('demo')
  })

  it('copies the configured email address with live feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    act(() => {
      root.render(createElement(ContactLinks))
    })

    const copyButton = container.querySelector(
      'button.contact-links__copy',
    ) as HTMLButtonElement

    await act(async () => {
      copyButton.click()
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith(CONTACT_CONFIG.email)
    expect(copyButton.getAttribute('aria-label')).toBe('Email copied')
    expect(container.textContent).toContain('Email address copied to clipboard.')
  })
})
