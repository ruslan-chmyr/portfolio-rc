import InkSeedWorker from './inkDistanceField.worker.ts?worker'
import { buildInkSeedBuffers, fingerprintInkShape } from './inkDistanceFieldCore'
import type { InkSeed } from './inkDistanceField'

export type InkSeedJob = {
  id: number
  width: number
  height: number
  shape: Uint8Array
  alpha: Uint8Array
  resolve: (seed: InkSeed | null) => void
  reject: (error: Error) => void
}

type Pending = {
  resolve: (seed: InkSeed | null) => void
  reject: (error: Error) => void
}

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()
let disabled = false

function ensureWorker(): Worker | null {
  if (disabled) return null
  if (worker) return worker
  try {
    worker = new InkSeedWorker()
    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as {
        id: number
        width?: number
        height?: number
        distancePixels?: Uint8Array
        maskPixels?: Uint8Array
        error?: string
      }
      const job = pending.get(message.id)
      if (!job) return
      pending.delete(message.id)
      if (message.error) {
        job.reject(new Error(message.error))
        return
      }
      if (
        !message.distancePixels ||
        !message.maskPixels ||
        message.width === undefined ||
        message.height === undefined
      ) {
        job.resolve(null)
        return
      }
      job.resolve({
        width: message.width,
        height: message.height,
        distancePixels: message.distancePixels,
        maskPixels: message.maskPixels,
      })
    }
    worker.onerror = () => {
      disabled = true
      worker?.terminate()
      worker = null
      for (const [id, job] of pending) {
        job.reject(new Error('Ink SDF worker failed'))
        pending.delete(id)
      }
    }
    return worker
  } catch {
    disabled = true
    return null
  }
}

export function disposeInkSeedWorker() {
  for (const [id, job] of pending) {
    job.reject(new Error('Ink SDF worker disposed'))
    pending.delete(id)
  }
  worker?.terminate()
  worker = null
}

export function buildInkSeedBuffersSync(
  width: number,
  height: number,
  shape: Uint8Array,
  alpha: Uint8Array,
): InkSeed {
  return buildInkSeedBuffers(width, height, shape, alpha)
}

export function requestInkSeedBuffers(
  width: number,
  height: number,
  shape: Uint8Array,
  alpha: Uint8Array,
): Promise<InkSeed | null> {
  const w = ensureWorker()
  if (!w) {
    return Promise.resolve(buildInkSeedBuffers(width, height, shape, alpha))
  }
  const id = nextId++
  const shapeCopy = new Uint8Array(shape)
  const alphaCopy = new Uint8Array(alpha)
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    w.postMessage(
      {
        id,
        width,
        height,
        shape: shapeCopy,
        alpha: alphaCopy,
      },
      [shapeCopy.buffer, alphaCopy.buffer],
    )
  })
}

export function shapeFingerprint(shape: Uint8Array) {
  return fingerprintInkShape(shape)
}
