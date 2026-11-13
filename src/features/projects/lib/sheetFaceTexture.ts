import type { Texture } from 'three'
import type { BookSheetFace } from './buildBookSheets'
import {
  canvasToTexture,
  createBackCoverCanvas,
  createCoverCanvas,
  createProjectDetailPageCanvas,
  createProjectVisualPageCanvas,
} from './createBookPageTexture'
import { PROJECT_BOOK_META } from '../model/projectBookConfig'
import type { ProjectBookEntry } from '../model/projectBookData'

export type SheetFacePaintListener = () => void

type CacheEntry = {
  texture: Texture
  refs: number
  disposed: boolean
  listeners: Set<SheetFacePaintListener>
}

const textureCache = new Map<string, CacheEntry>()
const warmupKeys = new Set<string>()

/** Deterministic key covering every painted field for the face. */
export function sheetFaceCacheKey(face: BookSheetFace): string {
  switch (face.kind) {
    case 'cover':
      return `cover:${PROJECT_BOOK_META.coverTitle}:${PROJECT_BOOK_META.years}`
    case 'backCover':
      return 'backCover'
    case 'visual':
      return `visual:${face.entry.id}:${face.entry.coverImage}`
    case 'detail': {
      const e = face.entry
      // Only fields painted by createProjectDetailPageCanvas.
      return [
        'detail',
        e.id,
        e.title,
        e.summary,
        e.role ?? '',
        e.technologies.join(','),
      ].join(':')
    }
  }
}

function paintFaceCanvas(
  face: BookSheetFace,
  notify: () => void,
): HTMLCanvasElement {
  switch (face.kind) {
    case 'cover':
      return createCoverCanvas(
        {
          title: PROJECT_BOOK_META.coverTitle,
          years: PROJECT_BOOK_META.years,
        },
        notify,
      )
    case 'backCover':
      return createBackCoverCanvas(notify)
    case 'visual':
      return createProjectVisualPageCanvas(face.entry, notify)
    case 'detail':
      return createProjectDetailPageCanvas(face.entry)
  }
}

function notifyListeners(entry: CacheEntry): void {
  if (entry.disposed || entry.refs <= 0 || !entry.texture) return
  entry.texture.needsUpdate = true
  for (const listener of entry.listeners) listener()
}

/**
 * Retain a sheet-face texture (refcount +1). Call only from committed lifecycles
 * (layout/effect), never from pure render calculations.
 */
export function createSheetFaceTexture(
  face: BookSheetFace,
  onPaint?: SheetFacePaintListener,
): Texture {
  const key = sheetFaceCacheKey(face)
  const existing = textureCache.get(key)
  if (existing && !existing.disposed) {
    existing.refs += 1
    if (onPaint) existing.listeners.add(onPaint)
    return existing.texture
  }

  const entry: CacheEntry = {
    texture: null as unknown as Texture,
    refs: 1,
    disposed: false,
    listeners: new Set(onPaint ? [onPaint] : []),
  }

  const notify = () => notifyListeners(entry)

  const canvas = paintFaceCanvas(face, notify)
  entry.texture = canvasToTexture(canvas)
  textureCache.set(key, entry)
  // Sync painters may have fired before the texture existed.
  notifyListeners(entry)
  return entry.texture
}

/** Drop one retain. Optionally detach a paint listener registered by that owner. */
export function releaseSheetFaceTexture(
  key: string,
  onPaint?: SheetFacePaintListener,
): void {
  const entry = textureCache.get(key)
  if (!entry || entry.disposed) return
  if (onPaint) entry.listeners.delete(onPaint)
  entry.refs = Math.max(0, entry.refs - 1)
  if (entry.refs > 0) return
  entry.disposed = true
  entry.listeners.clear()
  entry.texture.dispose()
  textureCache.delete(key)
  warmupKeys.delete(key)
}

/** True when the cache still owns a live texture for this key. */
export function isSheetFaceTextureActive(key: string): boolean {
  const entry = textureCache.get(key)
  return Boolean(entry && !entry.disposed && entry.refs > 0)
}

/** Warm cover + first project faces without mounting the Canvas. */
export function warmupInitialBookTextures(
  entries: readonly ProjectBookEntry[],
): void {
  const faces: BookSheetFace[] = [
    { kind: 'cover' },
    { kind: 'backCover' },
  ]
  const first = entries[0]
  if (first) {
    faces.push({ kind: 'visual', entry: first })
    faces.push({ kind: 'detail', entry: first })
  }
  const second = entries[1]
  if (second) faces.push({ kind: 'visual', entry: second })

  for (const face of faces) {
    const key = sheetFaceCacheKey(face)
    if (warmupKeys.has(key)) continue
    createSheetFaceTexture(face)
    warmupKeys.add(key)
  }
}

/** Release retains held solely by warmup (pages keep their own retains). */
export function releaseWarmupBookTextures(): void {
  for (const key of [...warmupKeys]) {
    warmupKeys.delete(key)
    releaseSheetFaceTexture(key)
  }
}

/**
 * Force-dispose every cached texture.
 * Call on Projects Canvas teardown after page meshes have released.
 */
export function clearSheetFaceTextureCache(): void {
  for (const entry of textureCache.values()) {
    entry.disposed = true
    entry.refs = 0
    entry.listeners.clear()
    entry.texture.dispose()
  }
  textureCache.clear()
  warmupKeys.clear()
}

/** Test / diagnostics helper. */
export function sheetFaceTextureCacheStats(): {
  size: number
  refsFor: (key: string) => number
} {
  return {
    size: textureCache.size,
    refsFor: (key: string) => textureCache.get(key)?.refs ?? 0,
  }
}
