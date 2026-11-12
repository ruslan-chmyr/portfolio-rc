// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { applyThemeAttribute } from './initTheme'

describe('theme attribute application', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('applies light and dark theme attributes without flash-prone defaults', () => {
    applyThemeAttribute('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    applyThemeAttribute('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
