/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BookSheetFace } from './buildBookSheets'
import type { ProjectBookEntry } from '../model/projectBookData'
import {
  clearSheetFaceTextureCache,
  createSheetFaceTexture,
  isSheetFaceTextureActive,
  releaseSheetFaceTexture,
  releaseWarmupBookTextures,
  sheetFaceCacheKey,
  sheetFaceTextureCacheStats,
  warmupInitialBookTextures,
} from './sheetFaceTexture'

const entry = (overrides: Partial<ProjectBookEntry> = {}): ProjectBookEntry => ({
  id: 'alpha',
  number: '01',
  title: 'Alpha',
  summary: 'Summary A',
  role: 'Frontend',
  technologies: ['React', 'Three'],
  coverImage: '/img/a.jpg',
  ...overrides,
})

afterEach(() => {
  clearSheetFaceTextureCache()
})

describe('sheetFaceCacheKey', () => {
  it('changes when detail content changes', () => {
    const a: BookSheetFace = { kind: 'detail', entry: entry() }
    const b: BookSheetFace = {
      kind: 'detail',
      entry: entry({ summary: 'Summary B' }),
    }
    const c: BookSheetFace = {
      kind: 'detail',
      entry: entry({ technologies: ['Vue'] }),
    }
    expect(sheetFaceCacheKey(a)).not.toBe(sheetFaceCacheKey(b))
    expect(sheetFaceCacheKey(a)).not.toBe(sheetFaceCacheKey(c))
  })

  it('is stable for identical faces', () => {
    const a: BookSheetFace = { kind: 'detail', entry: entry() }
    const b: BookSheetFace = { kind: 'detail', entry: entry() }
    expect(sheetFaceCacheKey(a)).toBe(sheetFaceCacheKey(b))
  })
})

describe('sheetFaceTexture cache lifecycle', () => {
  beforeEach(() => {
    // jsdom has no real 2d context; stub so canvas painters can run.
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      return {
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: () => ({ width: 40 }),
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
        drawImage: vi.fn(),
        strokeRect: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        arcTo: vi.fn(),
        closePath: vi.fn(),
      } as unknown as CanvasRenderingContext2D
    }) as typeof HTMLCanvasElement.prototype.getContext
  })

  it('returns the same texture on cache hit and refcounts owners', () => {
    const face: BookSheetFace = { kind: 'cover' }
    const a = createSheetFaceTexture(face)
    const b = createSheetFaceTexture(face)
    expect(a).toBe(b)
    const stats = sheetFaceTextureCacheStats()
    expect(stats.size).toBe(1)
    expect(stats.refsFor(sheetFaceCacheKey(face))).toBe(2)

    releaseSheetFaceTexture(sheetFaceCacheKey(face))
    expect(sheetFaceTextureCacheStats().refsFor(sheetFaceCacheKey(face))).toBe(1)

    releaseSheetFaceTexture(sheetFaceCacheKey(face))
    expect(sheetFaceTextureCacheStats().size).toBe(0)
  })

  it('does not keep disposed textures after clear', () => {
    const face: BookSheetFace = {
      kind: 'visual',
      entry: entry(),
    }
    const onPaint = vi.fn()
    const key = sheetFaceCacheKey(face)
    createSheetFaceTexture(face, onPaint)
    releaseSheetFaceTexture(key)
    expect(sheetFaceTextureCacheStats().size).toBe(0)
    createSheetFaceTexture(face, onPaint)
    clearSheetFaceTextureCache()
    expect(sheetFaceTextureCacheStats().size).toBe(0)
  })

  it('warmup retains then releaseWarmup drops unused textures', () => {
    warmupInitialBookTextures([entry(), entry({ id: 'beta', title: 'Beta' })])
    expect(sheetFaceTextureCacheStats().size).toBeGreaterThan(0)
    releaseWarmupBookTextures()
    expect(sheetFaceTextureCacheStats().size).toBe(0)
  })

  it('shared ownership survives one owner releasing', () => {
    const face: BookSheetFace = { kind: 'backCover' }
    createSheetFaceTexture(face)
    createSheetFaceTexture(face)
    const key = sheetFaceCacheKey(face)
    releaseSheetFaceTexture(key)
    expect(sheetFaceTextureCacheStats().size).toBe(1)
    expect(isSheetFaceTextureActive(key)).toBe(true)
    releaseSheetFaceTexture(key)
    expect(sheetFaceTextureCacheStats().size).toBe(0)
    expect(isSheetFaceTextureActive(key)).toBe(false)
  })

  it('ignores paint listeners after the last release', () => {
    const face: BookSheetFace = { kind: 'cover' }
    const onPaint = vi.fn()
    const key = sheetFaceCacheKey(face)
    createSheetFaceTexture(face, onPaint)
    onPaint.mockClear()
    releaseSheetFaceTexture(key, onPaint)
    expect(isSheetFaceTextureActive(key)).toBe(false)
    // Re-acquire with a different listener; previous owner must not be called.
    const other = vi.fn()
    createSheetFaceTexture(face, other)
    expect(onPaint).not.toHaveBeenCalled()
    expect(other).toHaveBeenCalled()
  })
})
