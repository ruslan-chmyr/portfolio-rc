import type { BufferGeometry } from 'three'

/**
 * Deform a subdivided page plane for a curl around the left spine.
 * `progress` 0 = flat on the right, 1 = fully flipped to the left.
 */
export function applyPageBend(
  geometry: BufferGeometry,
  progress: number,
  pageWidth: number,
): void {
  const pos = geometry.attributes.position
  if (!pos) return

  const t = Math.min(1, Math.max(0, progress))
  const angle = t * Math.PI
  const bend = Math.sin(t * Math.PI) * 0.28

  for (let i = 0; i < pos.count; i += 1) {
    const x0 = pos.getX(i)
    const y0 = pos.getY(i)
    // Geometry is authored with spine at x=0, page extending +x.
    const u = pageWidth <= 0 ? 0 : Math.min(1, Math.max(0, x0 / pageWidth))
    const localAngle = angle * u
    const radius = x0
    const x = radius * Math.cos(localAngle)
    const z = radius * Math.sin(localAngle) + Math.sin(u * Math.PI) * bend
    pos.setXYZ(i, x, y0, z)
  }

  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

/** Reset a page plane to a flat sheet on +x. */
export function resetPagePlane(
  geometry: BufferGeometry,
  pageWidth: number,
  pageHeight: number,
  segments: number,
): void {
  const pos = geometry.attributes.position
  if (!pos) return
  const seg = Math.max(1, segments)
  let i = 0
  for (let iy = 0; iy <= seg; iy += 1) {
    for (let ix = 0; ix <= seg; ix += 1) {
      const u = ix / seg
      const v = iy / seg
      pos.setXYZ(i, u * pageWidth, (0.5 - v) * pageHeight, 0)
      i += 1
    }
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}
