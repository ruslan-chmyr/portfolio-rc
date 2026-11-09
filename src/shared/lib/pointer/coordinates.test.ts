import { describe, expect, it } from 'vitest'
import { pointerProximity, sampleCanvasPointer, smoothFollow } from './coordinates'

describe('pointerProximity', () => {
  const bounds = new DOMRect(100, 100, 200, 100)

  it('returns 1 inside the padded hit area', () => {
    const proximity = pointerProximity(200, 150, bounds, {
      marginPx: 40,
      padXFactor: 0.12,
      padYFactor: 0.22,
    })
    expect(proximity).toBe(1)
  })

  it('decays with distance outside the canvas', () => {
    const proximity = pointerProximity(0, 150, bounds, {
      marginPx: 40,
      padXFactor: 0.12,
      padYFactor: 0.22,
    })
    expect(proximity).toBeGreaterThan(0)
    expect(proximity).toBeLessThan(1)
  })
})

describe('sampleCanvasPointer', () => {
  const bounds = new DOMRect(0, 0, 400, 200)
  const opts = {
    boundsX: [0.18, 0.82] as const,
    boundsY: [0.22, 0.78] as const,
    clampX: [0.22, 0.78] as const,
    clampY: [0.28, 0.72] as const,
    proximityCutoff: 0.08,
    proximityMin: 0.18,
  }

  it('normalizes Y with the WebGL-style flip', () => {
    const sample = sampleCanvasPointer(200, 100, bounds, 1, opts)
    expect(sample?.y).toBeCloseTo(0.5, 5)
  })

  it('rejects low-proximity off-canvas samples', () => {
    expect(sampleCanvasPointer(-200, -200, bounds, 0.05, opts)).toBeNull()
  })
})

describe('smoothFollow', () => {
  it('moves current toward target without overshooting in one step', () => {
    const current = { x: 0, y: 0 }
    const target = { x: 1, y: 1 }
    smoothFollow(current, target, 0.016, 12)
    expect(current.x).toBeGreaterThan(0)
    expect(current.x).toBeLessThan(1)
  })
})
