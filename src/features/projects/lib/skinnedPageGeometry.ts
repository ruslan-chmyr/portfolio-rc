/**
 * Shared skinned page geometry — adapted from the MIT-licensed
 * animated-book-slider-threejs / Wawa Sensei SkinnedMesh book pattern.
 * https://github.com/pakagronglb/animated-book-slider-threejs
 */
import {
  BoxGeometry,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Vector3,
} from 'three'
import { PROJECT_BOOK_SCENE } from '../model/projectBookConfig'

const {
  pageWidth: PAGE_WIDTH,
  pageHeight: PAGE_HEIGHT,
  pageDepth: PAGE_DEPTH,
  pageSegments: PAGE_SEGMENTS,
} = PROJECT_BOOK_SCENE

export const SKINNED_PAGE = {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  SEGMENT_WIDTH: PAGE_WIDTH / PAGE_SEGMENTS,
  /** Curve strengths from the reference implementation */
  easingFactor: 0.5,
  easingFactorFold: 0.3,
  insideCurveStrength: 0.18,
  outsideCurveStrength: 0.05,
  turningCurveStrength: 0.09,
} as const

let cachedGeometry: BoxGeometry | null = null

/** One shared BoxGeometry with skinIndex / skinWeight (spine → free edge). */
export function getSkinnedPageGeometry(): BoxGeometry {
  if (cachedGeometry) return cachedGeometry

  const geometry = new BoxGeometry(
    PAGE_WIDTH,
    PAGE_HEIGHT,
    PAGE_DEPTH,
    PAGE_SEGMENTS,
    2,
  )
  geometry.translate(PAGE_WIDTH / 2, 0, 0)

  const position = geometry.attributes.position
  if (!position) {
    cachedGeometry = geometry
    return geometry
  }

  const vertex = new Vector3()
  const skinIndexes: number[] = []
  const skinWeights: number[] = []
  const segmentWidth = SKINNED_PAGE.SEGMENT_WIDTH

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i)
    const x = vertex.x
    const skinIndex = Math.max(0, Math.floor(x / segmentWidth))
    const skinWeight = (x % segmentWidth) / segmentWidth
    skinIndexes.push(skinIndex, skinIndex + 1, 0, 0)
    skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
  }

  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndexes, 4))
  geometry.setAttribute(
    'skinWeight',
    new Float32BufferAttribute(skinWeights, 4),
  )

  cachedGeometry = geometry
  return geometry
}
