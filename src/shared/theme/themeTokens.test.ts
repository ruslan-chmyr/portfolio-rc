import { describe, expect, it } from 'vitest'
import { THEME_TOKENS, themeDetail } from './themeTokens'

describe('THEME_TOKENS', () => {
  it('maps light ink to black and dark ink to white', () => {
    expect(THEME_TOKENS.light.ink).toEqual([0, 0, 0])
    expect(THEME_TOKENS.dark.ink).toEqual([1, 1, 1])
  })

  it('inverts portfolio clear color relative to intro background', () => {
    expect(THEME_TOKENS.light.background).toEqual([1, 1, 1])
    expect(THEME_TOKENS.light.backgroundComplete).toEqual([0, 0, 0])
    expect(THEME_TOKENS.dark.background).toEqual([0, 0, 0])
    expect(THEME_TOKENS.dark.backgroundComplete).toEqual([1, 1, 1])
  })
})

describe('themeDetail', () => {
  it('returns the expected change payload fields', () => {
    expect(themeDetail('dark')).toEqual({
      theme: 'dark',
      ink: [1, 1, 1],
      fringe: [0.58, 0.58, 0.6],
      background: [0, 0, 0],
    })
  })
})
