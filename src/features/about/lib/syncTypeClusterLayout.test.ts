// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import gsap from 'gsap'
import { syncTypeClusterLayout } from './syncTypeClusterLayout'

vi.mock('./aboutTypeLayout', () => ({
  measureTypeClusterOffsets: vi.fn(() => [
    { x: 10, y: 20 },
    { x: -5, y: 30 },
  ]),
}))

function mountStage(wordCount = 2) {
  const stage = document.createElement('div')
  const words = Array.from({ length: wordCount }, () => document.createElement('div'))
  words.forEach((word) => stage.append(word))
  document.body.append(stage)
  return { stage, words }
}

describe('syncTypeClusterLayout', () => {
  afterEach(() => {
    document.body.replaceChildren()
    gsap.killTweensOf('*')
  })

  it('keeps a stage hidden with autoAlpha 0 after measurement', () => {
    const { stage, words } = mountStage()
    gsap.set(stage, { autoAlpha: 0, scale: 0.85, x: 12, y: -8 })

    syncTypeClusterLayout(stage, words)

    expect(Number(gsap.getProperty(stage, 'autoAlpha'))).toBe(0)
    expect(Number(gsap.getProperty(stage, 'opacity'))).toBe(0)
    expect(String(gsap.getProperty(stage, 'visibility'))).toBe('hidden')
  })

  it('keeps a visible stage visible after measurement', () => {
    const { stage, words } = mountStage()
    gsap.set(stage, { autoAlpha: 1, scale: 1, x: 0, y: 0 })

    syncTypeClusterLayout(stage, words)

    expect(Number(gsap.getProperty(stage, 'autoAlpha'))).toBe(1)
    expect(Number(gsap.getProperty(stage, 'opacity'))).toBe(1)
    // GSAP autoAlpha > 0 typically restores visibility as "inherit" (not "hidden").
    expect(String(gsap.getProperty(stage, 'visibility'))).not.toBe('hidden')
  })

  it('preserves a partially transparent stage opacity', () => {
    const { stage, words } = mountStage()
    gsap.set(stage, { autoAlpha: 0.42, scale: 1, x: 0, y: 0 })

    syncTypeClusterLayout(stage, words)

    expect(Number(gsap.getProperty(stage, 'opacity'))).toBeCloseTo(0.42, 5)
    expect(String(gsap.getProperty(stage, 'visibility'))).not.toBe('hidden')
  })

  it('restores scale and translation values after measurement', () => {
    const { stage, words } = mountStage()
    gsap.set(stage, { autoAlpha: 0.7, scale: 0.62, x: 40, y: -24 })

    syncTypeClusterLayout(stage, words)

    expect(Number(gsap.getProperty(stage, 'scale'))).toBeCloseTo(0.62, 5)
    expect(Number(gsap.getProperty(stage, 'x'))).toBeCloseTo(40, 5)
    expect(Number(gsap.getProperty(stage, 'y'))).toBeCloseTo(-24, 5)
    expect(Number(gsap.getProperty(stage, 'opacity'))).toBeCloseTo(0.7, 5)
  })

  it('does not accumulate incorrect inline styles across repeated measurements', () => {
    const { stage, words } = mountStage()
    gsap.set(stage, { autoAlpha: 0, scale: 0.9, x: 15, y: 9 })

    syncTypeClusterLayout(stage, words)
    syncTypeClusterLayout(stage, words)
    syncTypeClusterLayout(stage, words)

    expect(Number(gsap.getProperty(stage, 'autoAlpha'))).toBe(0)
    expect(Number(gsap.getProperty(stage, 'opacity'))).toBe(0)
    expect(String(gsap.getProperty(stage, 'visibility'))).toBe('hidden')
    expect(Number(gsap.getProperty(stage, 'scale'))).toBeCloseTo(0.9, 5)
    expect(Number(gsap.getProperty(stage, 'x'))).toBeCloseTo(15, 5)
    expect(Number(gsap.getProperty(stage, 'y'))).toBeCloseTo(9, 5)
  })

  it('preserves independent visibility:hidden when opacity is non-zero', () => {
    const { stage, words } = mountStage()
    gsap.set(stage, { opacity: 0.55, visibility: 'hidden', scale: 1, x: 0, y: 0 })

    syncTypeClusterLayout(stage, words)

    expect(Number(gsap.getProperty(stage, 'opacity'))).toBeCloseTo(0.55, 5)
    expect(String(gsap.getProperty(stage, 'visibility'))).toBe('hidden')
  })
})
