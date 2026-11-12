// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  isSceneBridgeBackground,
  syncThemeDependentSurfaces,
} from './syncThemeDependentSurfaces'

describe('isSceneBridgeBackground', () => {
  it('recognizes hex and rgb forms of the Skills navy bridge', () => {
    expect(isSceneBridgeBackground('#05070f')).toBe(true)
    expect(isSceneBridgeBackground('rgb(5, 7, 15)')).toBe(true)
    expect(isSceneBridgeBackground('rgba(5, 7, 15, 1)')).toBe(true)
  })

  it('rejects portfolio surface colors', () => {
    expect(isSceneBridgeBackground('#ffffff')).toBe(false)
    expect(isSceneBridgeBackground('rgb(0, 0, 0)')).toBe(false)
  })
})

describe('syncThemeDependentSurfaces', () => {
  it('clears stale non-bridge inline backgrounds on the About pin', () => {
    const root = document.createElement('div')
    const pin = document.createElement('div')
    pin.className = 'about-section__pin'
    pin.style.backgroundColor = 'rgb(255, 255, 255)'
    root.append(pin)

    syncThemeDependentSurfaces(root)

    expect(pin.style.backgroundColor).toBe('')
  })

  it('preserves the intentional navy bridge background', () => {
    const root = document.createElement('div')
    const pin = document.createElement('div')
    pin.className = 'about-section__pin'
    pin.style.backgroundColor = 'rgb(5, 7, 15)'
    root.append(pin)

    syncThemeDependentSurfaces(root)

    expect(pin.style.backgroundColor).toBe('rgb(5, 7, 15)')
  })
})
