// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PortfolioSectionIndex } from './PortfolioSectionIndex'

describe('PortfolioSectionIndex', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('renders the About-only full editorial progression with navigable following rows', () => {
    act(() => {
      root.render(createElement(PortfolioSectionIndex))
    })

    expect(container.textContent).toContain('01 / About')
    expect(container.textContent).toContain('02 / Skills')
    expect(container.textContent).toContain('03 / Projects')
    expect(container.textContent).toContain('04 / Experience')
    expect(container.textContent).toContain('05 / Contact')
    expect(container.querySelectorAll('button.about-section__index--inactive')).toHaveLength(
      4,
    )
    expect(container.querySelector('.about-section__index--active')?.textContent).toContain(
      '01 / About',
    )
  })

  it('renders decorative sticks instead of focusable buttons on the mobile band', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('max-width: 700px'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })

    act(() => {
      root.render(createElement(PortfolioSectionIndex))
    })

    expect(container.querySelectorAll('button.about-section__index--inactive')).toHaveLength(
      0,
    )
    expect(
      container.querySelectorAll('span.about-section__index--inactive[aria-hidden]'),
    ).toHaveLength(4)
  })
})
