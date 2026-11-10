// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { measureTypeClusterOffsets } from './aboutTypeLayout'

describe('measureTypeClusterOffsets', () => {
  it('returns one offset per word', () => {
    const stage = document.createElement('div')
    const a = document.createElement('div')
    const b = document.createElement('div')
    stage.append(a, b)
    document.body.append(stage)
    Object.defineProperty(stage, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })
    a.getBoundingClientRect = () => ({
      left: 40,
      top: 80,
      width: 200,
      height: 80,
      right: 240,
      bottom: 160,
      x: 40,
      y: 80,
      toJSON: () => ({}),
    })
    b.getBoundingClientRect = () => ({
      left: 40,
      top: 200,
      width: 220,
      height: 80,
      right: 260,
      bottom: 280,
      x: 40,
      y: 200,
      toJSON: () => ({}),
    })
    const offsets = measureTypeClusterOffsets(stage, [a, b])
    expect(offsets).toHaveLength(2)
    expect(offsets[0].x).not.toBe(0)
    stage.remove()
  })
})
