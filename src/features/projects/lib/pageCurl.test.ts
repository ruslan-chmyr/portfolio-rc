// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { PlaneGeometry } from 'three'
import {
  applyPageCurl,
  applyPageCurlRest,
  createPageCurlRest,
} from './pageCurl'

describe('pageCurl', () => {
  it('keeps spine vertices near x=0 and does not compound across frames', () => {
    const segments = 12
    const pageWidth = 1.12
    const rest = createPageCurlRest(pageWidth, 1.52, segments)
    const geo = new PlaneGeometry(pageWidth, 1.52, segments, segments)
    applyPageCurlRest(geo, rest)

    applyPageCurl(geo, rest, 0.5, 1)
    applyPageCurl(geo, rest, 0.5, 1)
    applyPageCurl(geo, rest, 1, 1)

    const pos = geo.attributes.position!
    const cols = segments + 1
    let spineMax = 0
    for (let row = 0; row <= segments; row += 1) {
      const i = row * cols
      spineMax = Math.max(spineMax, Math.abs(pos.getX(i)))
    }
    expect(spineMax).toBeLessThan(0.05)

    // Outer edge should land near -pageWidth after a full forward curl.
    const edge = pos.getX(segments)
    expect(edge).toBeLessThan(-pageWidth * 0.85)
    geo.dispose()
  })
})
