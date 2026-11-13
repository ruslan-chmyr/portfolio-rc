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

const textureCache = new Map<string, Texture>()

export function sheetFaceCacheKey(face: BookSheetFace): string {
  switch (face.kind) {
    case 'cover':
      return 'cover'
    case 'backCover':
      return 'backCover'
    case 'visual':
      return `visual:${face.entry.id}:${face.entry.coverImage}`
    case 'detail':
      return `detail:${face.entry.id}:${face.entry.title}`
  }
}

/** Rasterize a sheet face into a GPU texture (cached by face identity). */
export function createSheetFaceTexture(
  face: BookSheetFace,
  onPaint?: () => void,
): Texture {
  const key = sheetFaceCacheKey(face)
  const cached = textureCache.get(key)
  if (cached) {
    onPaint?.()
    return cached
  }

  let map: Texture | null = null
  const notify = () => {
    if (!map) return
    map.needsUpdate = true
    onPaint?.()
  }

  let canvas: HTMLCanvasElement
  switch (face.kind) {
    case 'cover':
      canvas = createCoverCanvas(
        {
          title: PROJECT_BOOK_META.coverTitle,
          years: PROJECT_BOOK_META.years,
        },
        notify,
      )
      break
    case 'backCover':
      canvas = createBackCoverCanvas(notify)
      break
    case 'visual':
      canvas = createProjectVisualPageCanvas(face.entry, notify)
      break
    case 'detail':
      canvas = createProjectDetailPageCanvas(face.entry)
      break
  }

  map = canvasToTexture(canvas)
  textureCache.set(key, map)
  return map
}

/** Warm cover + first project faces without mounting the Canvas. */
export function warmupInitialBookTextures(
  entries: readonly ProjectBookEntry[],
): void {
  createSheetFaceTexture({ kind: 'cover' })
  createSheetFaceTexture({ kind: 'backCover' })
  const first = entries[0]
  if (!first) return
  createSheetFaceTexture({ kind: 'visual', entry: first })
  createSheetFaceTexture({ kind: 'detail', entry: first })
  const second = entries[1]
  if (second) {
    createSheetFaceTexture({ kind: 'visual', entry: second })
  }
}

export function clearSheetFaceTextureCache(): void {
  for (const tex of textureCache.values()) {
    tex.dispose()
  }
  textureCache.clear()
}
