// @vitest-environment jsdom
import { createElement, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Compact menu lifecycle without mounting the full PortfolioNav tree
 * (theme + logo assets). Mirrors the mode-reset + Escape close behavior.
 */
function MenuLifecycleHarness({
  mode,
}: {
  mode: 'intro' | 'standard' | 'compact'
}) {
  const [menuOpen, setMenuOpen] = useState(true)
  const [menuMode, setMenuMode] = useState(mode)
  if (menuMode !== mode) {
    setMenuMode(mode)
    if (mode !== 'compact' && menuOpen) setMenuOpen(false)
  }
  const menuVisible = mode === 'compact' && menuOpen

  return createElement(
    'div',
    null,
    createElement(
      'button',
      {
        type: 'button',
        'aria-expanded': menuVisible,
        'data-testid': 'toggle',
        onClick: () => setMenuOpen((open) => !open),
      },
      menuVisible ? 'Close' : 'Menu',
    ),
    menuVisible
      ? createElement('ul', { 'data-testid': 'menu' }, 'sections')
      : null,
  )
}

describe('compact menu lifecycle', () => {
  let root: Root
  let host: HTMLDivElement

  beforeEach(() => {
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    // React 19 act environment under Vitest/jsdom.
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true
  })

  afterEach(() => {
    root.unmount()
    host.remove()
    vi.unstubAllGlobals()
  })

  it('closes when mode leaves compact', async () => {
    const { act } = await import('react')
    await act(async () => {
      root.render(createElement(MenuLifecycleHarness, { mode: 'compact' }))
    })
    expect(host.querySelector('[data-testid="menu"]')).not.toBeNull()
    expect(
      host.querySelector('button')?.getAttribute('aria-expanded'),
    ).toBe('true')

    await act(async () => {
      root.render(createElement(MenuLifecycleHarness, { mode: 'standard' }))
    })
    expect(host.querySelector('[data-testid="menu"]')).toBeNull()
    expect(
      host.querySelector('button')?.getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('stays closed in intro mode', async () => {
    const { act } = await import('react')
    await act(async () => {
      root.render(createElement(MenuLifecycleHarness, { mode: 'intro' }))
    })
    expect(host.querySelector('[data-testid="menu"]')).toBeNull()
  })
})
