import { describe, expect, it } from 'vitest'
import { resolveKeycapLegendMode } from './useSvgTexture'

describe('resolveKeycapLegendMode', () => {
  it('renders icon only when configured and ready', () => {
    expect(resolveKeycapLegendMode(true, 'ready')).toBe('icon')
  })

  it('falls back to shortLabel while loading or on error', () => {
    expect(resolveKeycapLegendMode(true, 'loading')).toBe('label')
    expect(resolveKeycapLegendMode(true, 'error')).toBe('label')
    expect(resolveKeycapLegendMode(true, 'idle')).toBe('label')
  })

  it('uses shortLabel when no icon is configured', () => {
    expect(resolveKeycapLegendMode(false, 'ready')).toBe('label')
    expect(resolveKeycapLegendMode(false, 'idle')).toBe('label')
  })
})
