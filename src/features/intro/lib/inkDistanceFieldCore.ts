export const INK_DISTANCE_RANGE = 1.5

export type InkSeedBuffers = {
  width: number
  height: number
  distancePixels: Uint8Array
  maskPixels: Uint8Array
}

const INF = 1e12

export function packSignedDistanceTexel(
  signed: number,
  range = INK_DISTANCE_RANGE,
): readonly [number, number] {
  const normalized = Math.max(0, Math.min(1, (signed + range) / (2 * range)))
  const packed = Math.round(normalized * 65535)
  return [packed >> 8, packed & 255]
}

// Linear-time squared Euclidean distance transform (1-D parabola envelope).
function edt1d(input: Float64Array, output: Float64Array, size: number) {
  const locations = new Int32Array(size)
  const bounds = new Float64Array(size + 1)
  let top = 0
  locations[0] = 0
  bounds[0] = -Infinity
  bounds[1] = Infinity

  for (let q = 1; q < size; q += 1) {
    let intersection = 0
    while (true) {
      const p = locations[top]
      intersection = (input[q] + q * q - input[p] - p * p) / (2 * (q - p))
      if (intersection > bounds[top]) break
      if (top === 0) break
      top -= 1
    }
    top += 1
    locations[top] = q
    bounds[top] = intersection
    bounds[top + 1] = Infinity
  }

  top = 0
  for (let q = 0; q < size; q += 1) {
    while (bounds[top + 1] < q) top += 1
    const delta = q - locations[top]
    output[q] = delta * delta + input[locations[top]]
  }
}

function squaredDistance(mask: Uint8Array, width: number, height: number, toInk: boolean) {
  const intermediate = new Float64Array(width * height)
  const output = new Float64Array(width * height)
  const a = new Float64Array(Math.max(width, height))
  const b = new Float64Array(Math.max(width, height))

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      a[y] = Boolean(mask[y * width + x]) === toInk ? 0 : INF
    }
    edt1d(a, b, height)
    for (let y = 0; y < height; y += 1) intermediate[y * width + x] = b[y]
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) a[x] = intermediate[y * width + x]
    edt1d(a, b, width)
    for (let x = 0; x < width; x += 1) output[y * width + x] = b[x]
  }
  return output
}

export function buildInkSeedBuffers(
  width: number,
  height: number,
  shape: Uint8Array,
  alpha: Uint8Array,
): InkSeedBuffers {
  const count = width * height
  const toInk = squaredDistance(shape, width, height, true)
  const toPaper = squaredDistance(shape, width, height, false)
  const distancePixels = new Uint8Array(count * 4)
  const maskPixels = new Uint8Array(count * 4)
  const unit = Math.min(width, height)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const src = y * width + x
      const dest = ((height - 1 - y) * width + x) * 4
      const signed = (Math.sqrt(toInk[src]) - Math.sqrt(toPaper[src])) / unit
      const [distanceHi, distanceLo] = packSignedDistanceTexel(signed)
      distancePixels[dest] = distanceHi
      distancePixels[dest + 1] = distanceLo
      distancePixels[dest + 3] = 255

      const a = alpha[src]
      maskPixels[dest] = 0
      maskPixels[dest + 1] = 0
      maskPixels[dest + 2] = 0
      maskPixels[dest + 3] = a
    }
  }

  return { width, height, distancePixels, maskPixels }
}

export function fingerprintInkShape(shape: Uint8Array): string {
  let hash = 2166136261
  const step = Math.max(1, Math.floor(shape.length / 512))
  for (let i = 0; i < shape.length; i += step) {
    hash ^= shape[i]
    hash = Math.imul(hash, 16777619)
  }
  return `${shape.length}:${hash >>> 0}`
}
