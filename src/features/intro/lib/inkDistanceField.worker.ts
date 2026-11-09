import { buildInkSeedBuffers } from './inkDistanceFieldCore'

export type InkSeedWorkerRequest = {
  id: number
  width: number
  height: number
  shape: Uint8Array
  alpha: Uint8Array
}

export type InkSeedWorkerResponse = {
  id: number
  width: number
  height: number
  distancePixels: Uint8Array
  maskPixels: Uint8Array
}

self.onmessage = (event: MessageEvent<InkSeedWorkerRequest>) => {
  const { id, width, height, shape, alpha } = event.data
  try {
    const buffers = buildInkSeedBuffers(width, height, shape, alpha)
    const response: InkSeedWorkerResponse = {
      id,
      width,
      height,
      distancePixels: buffers.distancePixels,
      maskPixels: buffers.maskPixels,
    }
    self.postMessage(response, {
      transfer: [
        response.distancePixels.buffer,
        response.maskPixels.buffer,
        shape.buffer,
        alpha.buffer,
      ],
    })
  } catch (error) {
    self.postMessage({ id, error: String(error) })
  }
}
