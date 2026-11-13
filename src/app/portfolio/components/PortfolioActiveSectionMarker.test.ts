// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PortfolioActiveSectionMarker } from './PortfolioActiveSectionMarker'

describe('PortfolioActiveSectionMarker', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('renders registry label without aria-current on a decorative host', () => {
    act(() => {
      root.render(
        createElement(PortfolioActiveSectionMarker, {
          sectionId: 'expertise',
          orientation: 'vertical',
        }),
      )
    })

    const marker = container.querySelector('.portfolio-active-marker')
    expect(marker).not.toBeNull()
    expect(marker?.getAttribute('aria-current')).toBeNull()
    expect(marker?.getAttribute('data-section')).toBe('expertise')
    expect(container.textContent).toContain('02 / Skills')
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('a')).toBeNull()
  })

  it('supports horizontal orientation for Experience/Contact', () => {
    act(() => {
      root.render(
        createElement(PortfolioActiveSectionMarker, {
          sectionId: 'contact',
          orientation: 'horizontal',
        }),
      )
    })
    const marker = container.querySelector('.portfolio-active-marker--horizontal')
    expect(marker).not.toBeNull()
    expect(container.textContent).toContain('05 / Contact')
  })
})
