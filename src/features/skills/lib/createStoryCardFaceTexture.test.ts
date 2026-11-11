import { describe, expect, it } from 'vitest'
import { buildStoryCardFaceCacheKey } from './createStoryCardFaceTexture'

describe('buildStoryCardFaceCacheKey', () => {
  it('changes when typography or dimensions change', () => {
    const base = {
      coverSrc: 'cover',
      title: 'A',
      subtitle: 'B',
      eyebrow: '01',
      cta: 'Explore',
    }
    const a = buildStoryCardFaceCacheKey(base, { width: 360, height: 520, pixelRatio: 2 })
    const b = buildStoryCardFaceCacheKey(
      { ...base, title: 'C' },
      { width: 360, height: 520, pixelRatio: 2 },
    )
    const c = buildStoryCardFaceCacheKey(base, { width: 400, height: 520, pixelRatio: 2 })
    expect(a).not.toBe(b)
    expect(a).not.toBe(c)
  })

  it('is stable for identical face content and size', () => {
    const content = {
      coverSrc: 'cover',
      title: 'Architecture',
      subtitle: 'Shared contracts',
      eyebrow: 'Highlight 01 · Frontend',
      cta: 'Explore Highlight',
    }
    const options = { width: 360, height: 529, pixelRatio: 2, cornerRadius: 24 }
    expect(buildStoryCardFaceCacheKey(content, options)).toBe(
      buildStoryCardFaceCacheKey(content, options),
    )
  })
})
