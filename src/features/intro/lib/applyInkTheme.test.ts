import { describe, expect, it, vi } from 'vitest'
import { applyInkTheme } from './applyInkTheme'
import type { LiquidRenderer } from '../../../shared/graphics/fluid/types'
import type { InkTransitionRenderer } from './createInkTransitionRenderer'

describe('applyInkTheme', () => {
  it('forwards rgb tokens to fluid and transition renderers', () => {
    const renderer: LiquidRenderer = {
      setInkColors: vi.fn(),
      draw: vi.fn(),
      dispose: vi.fn(),
    }
    const inkTransition: InkTransitionRenderer = {
      setInkColors: vi.fn(),
      capture: vi.fn(),
      captureAsync: vi.fn(),
      warmSeedCache: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    }

    applyInkTheme(renderer, inkTransition, 'dark')

    expect(renderer.setInkColors).toHaveBeenCalledWith({
      ink: [1, 1, 1],
      clear: [0, 0, 0],
    })
    expect(inkTransition.setInkColors).toHaveBeenCalledWith({
      ink: [1, 1, 1],
      fringe: [0.58, 0.58, 0.6],
    })
  })
})
