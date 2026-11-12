/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { resolveTrailingCursorMode } from './resolveTrailingCursorMode'

describe('resolveTrailingCursorMode', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('returns default for non-elements and plain content', () => {
    expect(resolveTrailingCursorMode(null)).toBe('default')
    const p = document.createElement('p')
    p.textContent = 'Hello'
    document.body.append(p)
    expect(resolveTrailingCursorMode(p)).toBe('default')
  })

  it('detects native form fields so the system cursor can return', () => {
    const input = document.createElement('input')
    document.body.append(input)
    expect(resolveTrailingCursorMode(input)).toBe('native')
  })

  it('detects links and interactive controls', () => {
    const link = document.createElement('a')
    link.href = '#about'
    link.textContent = 'About'
    document.body.append(link)
    expect(resolveTrailingCursorMode(link)).toBe('link')

    const button = document.createElement('button')
    button.textContent = 'Menu'
    document.body.append(button)
    expect(resolveTrailingCursorMode(button)).toBe('interactive')
  })

  it('detects drag targets and honors explicit data-cursor', () => {
    const carousel = document.createElement('div')
    carousel.className = 'circular-carousel'
    document.body.append(carousel)
    expect(resolveTrailingCursorMode(carousel)).toBe('drag')

    const custom = document.createElement('div')
    custom.setAttribute('data-cursor', 'interactive')
    const child = document.createElement('span')
    custom.append(child)
    document.body.append(custom)
    expect(resolveTrailingCursorMode(child)).toBe('interactive')
  })

  it('treats CTA-style anchors as interactive rather than text links', () => {
    const social = document.createElement('a')
    social.href = 'https://example.com'
    social.className = 'contact-links__social'
    document.body.append(social)
    expect(resolveTrailingCursorMode(social)).toBe('interactive')
  })
})
