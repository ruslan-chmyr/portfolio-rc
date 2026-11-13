import type { BufferGeometry } from 'three'

export type PageCurlRest = {
  /** Flat rest positions: [x,y,z, x,y,z, ...] — spine at 0, sheet on +x */
  positions: Float32Array
  pageWidth: number
  pageHeight: number
  segments: number
}

/**
 * Author a flat page with spine at x=0, sheet extending toward +x.
 * Stores rest positions so curls never compound across frames.
 */
export function createPageCurlRest(
  pageWidth: number,
  pageHeight: number,
  segments: number,
): PageCurlRest {
  const seg = Math.max(1, segments)
  const count = (seg + 1) * (seg + 1)
  const positions = new Float32Array(count * 3)
  let i = 0
  for (let iy = 0; iy <= seg; iy += 1) {
    for (let ix = 0; ix <= seg; ix += 1) {
      const u = ix / seg
      const v = iy / seg
      positions[i] = u * pageWidth
      positions[i + 1] = (0.5 - v) * pageHeight
      positions[i + 2] = 0
      i += 3
    }
  }
  return { positions, pageWidth, pageHeight, segments: seg }
}

/** Write rest pose into a geometry attribute. */
export function applyPageCurlRest(
  geometry: BufferGeometry,
  rest: PageCurlRest,
): void {
  const pos = geometry.attributes.position
  if (!pos || pos.count * 3 !== rest.positions.length) return
  pos.array.set(rest.positions)
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

/**
 * Curl a page from rest around the spine.
 * `progress` 0 → 1; direction 1 = right→left, -1 = left→right.
 */
export function applyPageCurl(
  geometry: BufferGeometry,
  rest: PageCurlRest,
  progress: number,
  direction: 1 | -1 = 1,
): void {
  const pos = geometry.attributes.position
  if (!pos || pos.count * 3 !== rest.positions.length) return

  const t = Math.min(1, Math.max(0, progress))
  const angle = t * Math.PI
  const arch = Math.sin(t * Math.PI) * (rest.pageWidth * 0.16)
  const { pageWidth } = rest
  const src = rest.positions
  const dir = direction >= 0 ? 1 : -1

  for (let i = 0; i < pos.count; i += 1) {
    const i3 = i * 3
    const x0 = src[i3]!
    const y0 = src[i3 + 1]!
    const u = pageWidth <= 0 ? 0 : Math.min(1, Math.max(0, x0 / pageWidth))
    // Outer edge leads the turn.
    const local = angle * u ** 0.82
    const cos = Math.cos(local)
    const sin = Math.sin(local)
    const x = dir * x0 * cos
    const z = dir * x0 * sin + Math.sin(u * Math.PI) * arch
    pos.setXYZ(i, x, y0, z)
  }

  pos.needsUpdate = true
  geometry.computeVertexNormals()
}
