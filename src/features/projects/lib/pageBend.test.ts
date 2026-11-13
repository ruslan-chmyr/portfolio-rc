// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { PlaneGeometry } from 'three'
import { applyPageBend, resetPagePlane } from './pageBend'

describe('pageBend', () => {
  it('keeps spine vertices near x=0 across a full curl', () => {
    const segments = 12
    const pageWidth = 1.35
    const geo = new PlaneGeometry(pageWidth, 1.9, segments, segments)
    resetPagePlane(geo, pageWidth, 1.9, segments)
    applyPageBend(geo, 1, pageWidth)
    const pos = geo.attributes.position!
    const cols = segments + 1
    let spineMax = 0
    for (let row = 0; row <= segments; row += 1) {
      const i = row * cols
      spineMax = Math.max(spineMax, Math.abs(pos.getX(i)))
    }
    expect(spineMax).toBeLessThan(0.08)
    geo.dispose()
  })
})
