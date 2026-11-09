import { rasterizeInkSeedInputs, type InkSeed } from './inkDistanceField'
import { requestInkSeedBuffers } from './inkSeedWorkerClient'
import { buildInkSeedBuffers } from './inkDistanceFieldCore'
import {
  clearInkSeedCacheHit,
  markInkSeedCacheHit,
  recordIntroPerf,
} from './introPerf'
import {
  INK_TRANSITION_FRAGMENT,
  INK_TRANSITION_VERTEX,
} from './inkTransitionShaders'
import { disposeInkSeedWorker } from './inkSeedWorkerClient'
import {
  createFullscreenQuadVAO,
  createResourceManager,
  createShaderProgram,
  createTexture2D,
} from '../../../shared/lib/webgl'

/** Scales ambient idle motion only; scroll progress and deformation gains stay fixed. */
const INK_AMBIENT_TIME_SCALE = 1.25

export type InkTransitionColors = {
  ink: readonly [number, number, number]
  fringe: readonly [number, number, number]
}

export type InkTransitionRenderer = {
  capture(source: HTMLCanvasElement): boolean
  captureAsync(source: HTMLCanvasElement): Promise<boolean>
  warmSeedCache(source: HTMLCanvasElement): void
  render(progress: number, elapsedSeconds?: number): void
  setInkColors(colors: InkTransitionColors): void
  dispose(): void
}

export function createInkTransitionRenderer(
  canvas: HTMLCanvasElement,
): InkTransitionRenderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
  })
  if (!gl) return null
  const glContext = gl

  const resources = createResourceManager()
  try {
    const program = createShaderProgram(
      glContext,
      INK_TRANSITION_VERTEX,
      INK_TRANSITION_FRAGMENT,
      resources,
      'ink transition',
    )
    const { vao } = createFullscreenQuadVAO(glContext, resources)

    const makeTexture = (filter: number) =>
      createTexture2D(glContext, resources, {
        internalFormat: glContext.RGBA8,
        type: glContext.UNSIGNED_BYTE,
        minFilter: filter,
        magFilter: filter,
        allocateStorage: false,
      })

    const sdf = makeTexture(glContext.NEAREST)
    const seed = makeTexture(glContext.LINEAR)
    const uDistance = glContext.getUniformLocation(program, 'uDistance')
    const uSeed = glContext.getUniformLocation(program, 'uSeed')
    const uProgress = glContext.getUniformLocation(program, 'uProgress')
    const uTime = glContext.getUniformLocation(program, 'uTime')
    const uAspect = glContext.getUniformLocation(program, 'uAspect')
    const uInkColor = glContext.getUniformLocation(program, 'uInkColor')
    const uFringeColor = glContext.getUniformLocation(program, 'uFringeColor')
    let inkColor: [number, number, number] = [0, 0, 0]
    let fringeColor: [number, number, number] = [0.48, 0.48, 0.51]
    glContext.useProgram(program)
    glContext.uniform1i(uDistance, 0)
    glContext.uniform1i(uSeed, 1)
    glContext.disable(glContext.DEPTH_TEST)
    glContext.disable(glContext.BLEND)
    let captured = false
    let disposed = false
    let cachedSeed: InkSeed | null = null
    let cachedFingerprint: string | null = null
    let cacheJob: Promise<void> | null = null

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.max(1, Math.round(window.innerWidth * dpr))
      const h = Math.max(1, Math.round(window.innerHeight * dpr))
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      glContext.viewport(0, 0, w, h)
    }

    function uploadPixels(pixels: InkSeed) {
      resize()
      glContext.activeTexture(glContext.TEXTURE0)
      glContext.bindTexture(glContext.TEXTURE_2D, sdf)
      glContext.texImage2D(
        glContext.TEXTURE_2D,
        0,
        glContext.RGBA8,
        pixels.width,
        pixels.height,
        0,
        glContext.RGBA,
        glContext.UNSIGNED_BYTE,
        pixels.distancePixels,
      )
      glContext.activeTexture(glContext.TEXTURE1)
      glContext.bindTexture(glContext.TEXTURE_2D, seed)
      glContext.texImage2D(
        glContext.TEXTURE_2D,
        0,
        glContext.RGBA8,
        pixels.width,
        pixels.height,
        0,
        glContext.RGBA,
        glContext.UNSIGNED_BYTE,
        pixels.maskPixels,
      )
      captured = true
    }

    function uploadFromRaster(
      raster: NonNullable<ReturnType<typeof rasterizeInkSeedInputs>>,
      pixels: InkSeed,
    ) {
      if (cachedFingerprint === raster.fingerprint && cachedSeed) {
        uploadPixels(cachedSeed)
        markInkSeedCacheHit(raster.fingerprint)
        return true
      }
      clearInkSeedCacheHit()
      uploadPixels(pixels)
      cachedSeed = pixels
      cachedFingerprint = raster.fingerprint
      return true
    }

    return {
      capture(source) {
        if (disposed || glContext.isContextLost()) return false
        try {
          const raster = rasterizeInkSeedInputs(source)
          if (!raster) return false
          if (cachedSeed && cachedFingerprint === raster.fingerprint) {
            uploadPixels(cachedSeed)
            markInkSeedCacheHit(raster.fingerprint)
            return true
          }
          const t0 = performance.now()
          const pixels = buildInkSeedBuffers(
            raster.width,
            raster.height,
            raster.shape,
            raster.alpha,
          )
          recordIntroPerf('sdfMainThreadMs', performance.now() - t0)
          return uploadFromRaster(raster, pixels)
        } catch (error) {
          console.warn('Could not capture liquid RC for scroll transition', error)
          captured = false
          return false
        }
      },
      async captureAsync(source) {
        if (disposed || glContext.isContextLost()) return false
        try {
          const raster = rasterizeInkSeedInputs(source)
          if (!raster) return false
          if (cachedSeed && cachedFingerprint === raster.fingerprint) {
            uploadPixels(cachedSeed)
            markInkSeedCacheHit(raster.fingerprint)
            return true
          }
          clearInkSeedCacheHit()
          const t0 = performance.now()
          const pixels = await requestInkSeedBuffers(
            raster.width,
            raster.height,
            raster.shape,
            raster.alpha,
          )
          recordIntroPerf('sdfWorkerMs', performance.now() - t0)
          if (!pixels) return false
          return uploadFromRaster(raster, pixels)
        } catch (error) {
          console.warn('Could not capture liquid RC for scroll transition', error)
          captured = false
          return false
        }
      },
      warmSeedCache(source) {
        if (disposed || glContext.isContextLost()) return
        if (cacheJob) return
        cacheJob = (async () => {
          const raster = rasterizeInkSeedInputs(source)
          if (!raster) return
          if (cachedFingerprint === raster.fingerprint && cachedSeed) return
          const pixels = await requestInkSeedBuffers(
            raster.width,
            raster.height,
            raster.shape,
            raster.alpha,
          )
          if (!pixels || disposed) return
          cachedSeed = pixels
          cachedFingerprint = raster.fingerprint
        })().finally(() => {
          cacheJob = null
        })
      },
      render(progress, elapsedSeconds = 0) {
        if (!captured || disposed || glContext.isContextLost()) return
        resize()
        glContext.bindFramebuffer(glContext.FRAMEBUFFER, null)
        glContext.clearColor(0, 0, 0, 0)
        glContext.clear(glContext.COLOR_BUFFER_BIT)
        glContext.useProgram(program)
        glContext.bindVertexArray(vao)
        glContext.activeTexture(glContext.TEXTURE0)
        glContext.bindTexture(glContext.TEXTURE_2D, sdf)
        glContext.activeTexture(glContext.TEXTURE1)
        glContext.bindTexture(glContext.TEXTURE_2D, seed)
        glContext.uniform1f(uProgress, Math.max(0, Math.min(1, progress)))
        glContext.uniform1f(uTime, elapsedSeconds * INK_AMBIENT_TIME_SCALE)
        glContext.uniform1f(uAspect, canvas.width / canvas.height)
        glContext.uniform3f(uInkColor, inkColor[0], inkColor[1], inkColor[2])
        glContext.uniform3f(uFringeColor, fringeColor[0], fringeColor[1], fringeColor[2])
        glContext.drawArrays(glContext.TRIANGLES, 0, 6)
        glContext.bindVertexArray(null)
      },
      setInkColors(colors) {
        inkColor = [colors.ink[0], colors.ink[1], colors.ink[2]]
        fringeColor = [colors.fringe[0], colors.fringe[1], colors.fringe[2]]
      },
      dispose() {
        if (disposed) return
        disposed = true
        cachedSeed = null
        cachedFingerprint = null
        disposeInkSeedWorker()
        resources.disposeAll()
      },
    }
  } catch (error) {
    console.warn('Organic ink scroll renderer unavailable', error)
    resources.disposeAll()
    return null
  }
}
