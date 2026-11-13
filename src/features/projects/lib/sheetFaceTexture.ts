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

/** Rasterize a sheet face into a GPU texture (async paints bump needsUpdate). */
export function createSheetFaceTexture(
  face: BookSheetFace,
  onPaint?: () => void,
): Texture {
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
  return map
}

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
