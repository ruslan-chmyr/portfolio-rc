import { describe, expect, it } from 'vitest'
import { INK_DISTANCE_RANGE, packSignedDistanceTexel } from './inkDistanceField'

describe('packSignedDistanceTexel', () => {
  it('packs the neutral isocontour at mid-range', () => {
    expect(packSignedDistanceTexel(0)).toEqual([128, 0])
  })

  it('packs negative distances toward zero and positive toward one', () => {
    const inside = packSignedDistanceTexel(-INK_DISTANCE_RANGE)
    const outside = packSignedDistanceTexel(INK_DISTANCE_RANGE)
    expect(inside[0]).toBeLessThan(128)
    expect(outside[0]).toBeGreaterThan(128)
  })
})
