// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { getSkinnedPageGeometry, SKINNED_PAGE } from './skinnedPageGeometry'

describe('skinnedPageGeometry', () => {
  it('authors skinIndex/skinWeight for the bone chain', () => {
    const geo = getSkinnedPageGeometry()
    const skinIndex = geo.getAttribute('skinIndex')
    const skinWeight = geo.getAttribute('skinWeight')
    expect(skinIndex).toBeTruthy()
    expect(skinWeight).toBeTruthy()
    expect(skinIndex!.itemSize).toBe(4)
    expect(skinWeight!.itemSize).toBe(4)
    expect(skinIndex!.count).toBeGreaterThan(SKINNED_PAGE.PAGE_SEGMENTS)
    // Shared singleton
    expect(getSkinnedPageGeometry()).toBe(geo)
  })
})
