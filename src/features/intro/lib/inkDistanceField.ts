/**
 * Encode the current RC alpha silhouette as a signed distance field.
 * Distances are measured in viewport-short-side units and packed into RG16.
 */
import {
  buildInkSeedBuffers,
  fingerprintInkShape,
  INK_DISTANCE_RANGE,
  packSignedDistanceTexel,
} from './inkDistanceFieldCore'
import { recordIntroPerf, type InkSeedRaster } from './introPerf'
import { requestInkSeedBuffers } from './inkSeedWorkerClient'

export type InkSeed = {
  width: number
  height: number
  distancePixels: Uint8Array
  maskPixels: Uint8Array
}

export { INK_DISTANCE_RANGE, packSignedDistanceTexel }

export function rasterizeInkSeedInputs(source: HTMLCanvasElement): InkSeedRaster | null {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const bounds = source.getBoundingClientRect()
  if (!viewportWidth || !viewportHeight || !bounds.width || !bounds.height) return null

  const width = Math.max(480, Math.min(1280, Math.round(viewportWidth * 0.90)))
  const height = Math.max(1, Math.round(width * viewportHeight / viewportWidth))
  const raster = document.createElement('canvas')
  raster.width = width
  raster.height = height
  const context = raster.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  const sx = width / viewportWidth
  const sy = height / viewportHeight
  context.clearRect(0, 0, width, height)
  context.drawImage(
    source,
    bounds.left * sx,
    bounds.top * sy,
    bounds.width * sx,
    bounds.height * sy,
  )

  const pixels = context.getImageData(0, 0, width, height).data
  const count = width * height
  const shape = new Uint8Array(count)
  const alpha = new Uint8Array(count)
  let filled = 0
  for (let i = 0; i < count; i += 1) {
    const a = pixels[i * 4 + 3]
    alpha[i] = a
    const solid = a >= 128 ? 1 : 0
    shape[i] = solid
    filled += solid
  }
  if (filled < 32) return null

  return {
    width,
    height,
    shape,
    alpha,
    fingerprint: fingerprintInkShape(shape),
  }
}

/** Synchronous seed build (CPU EDT on main thread). */
export function createInkSeed(source: HTMLCanvasElement): InkSeed | null {
  const raster = rasterizeInkSeedInputs(source)
  if (!raster) return null
  const t0 = performance.now()
  const seed = buildInkSeedBuffers(raster.width, raster.height, raster.shape, raster.alpha)
  recordIntroPerf('sdfMainThreadMs', performance.now() - t0)
  return seed
}

export async function createInkSeedAsync(source: HTMLCanvasElement): Promise<InkSeed | null> {
  const raster = rasterizeInkSeedInputs(source)
  if (!raster) return null
  const t0 = performance.now()
  const seed = await requestInkSeedBuffers(
    raster.width,
    raster.height,
    raster.shape,
    raster.alpha,
  )
  recordIntroPerf('sdfWorkerMs', performance.now() - t0)
  return seed
}
