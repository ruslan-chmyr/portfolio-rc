import { useEffect, useState } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

export type SvgTextureStatus = 'idle' | 'loading' | 'ready' | 'error'

export type SvgTextureResult = {
  texture: CanvasTexture | null
  status: SvgTextureStatus
}

type CacheEntry = {
  texture: CanvasTexture
  status: 'ready'
}

/**
 * Session cache — shared across FE/AI remounts of the same icon+tint.
 *
 * Ownership: the cache owns CanvasTextures for the page lifetime (or test reset).
 * Keycap materials that bind a cached map must use `dispose={null}` so R3F does not
 * dispose the shared texture when a keycap unmounts during a category flip.
 *
 * Async safety: load completion bumps React state only when the hook is still mounted.
 * Error entries stay cached for the session (acceptable for a fixed local SVG set).
 */
const textureCache = new Map<string, CacheEntry | { status: 'error' }>()
const inflight = new Map<string, Promise<void>>()

function cacheKey(url: string, tint: string, size: number) {
  return `${url}::${tint}::${size}`
}

function rasterizeSvg(url: string, tint: string, size: number): Promise<CanvasTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('2d context unavailable'))
        return
      }
      const inset = Math.round(size * 0.08)
      const draw = size - inset * 2
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, inset, inset, draw, draw)
      ctx.globalCompositeOperation = 'source-in'
      ctx.fillStyle = tint
      ctx.fillRect(0, 0, size, size)
      ctx.globalCompositeOperation = 'source-over'
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.needsUpdate = true
      resolve(texture)
    }
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })
}

/**
 * Rasterize an SVG URL onto a canvas texture for keycap legends.
 * Results are cached by url+tint+size so category flips do not re-decode icons.
 */
export function useSvgTexture(
  url: string | undefined,
  tint = '#FFFFFF',
  size = 128,
): SvgTextureResult {
  const key = url ? cacheKey(url, tint, size) : null
  const [, setVersion] = useState(0)

  useEffect(() => {
    if (!url || !key) return
    if (textureCache.has(key)) return

    let cancelled = false
    let load = inflight.get(key)
    if (!load) {
      load = rasterizeSvg(url, tint, size)
        .then((texture) => {
          textureCache.set(key, { texture, status: 'ready' })
        })
        .catch(() => {
          textureCache.set(key, { status: 'error' })
        })
        .finally(() => {
          inflight.delete(key)
        })
      inflight.set(key, load)
    }

    load.finally(() => {
      if (!cancelled) setVersion((value) => value + 1)
    })

    return () => {
      cancelled = true
    }
  }, [url, tint, size, key])

  if (!url || !key) return { texture: null, status: 'idle' }
  const entry = textureCache.get(key)
  if (!entry) return { texture: null, status: 'loading' }
  if (entry.status === 'error') return { texture: null, status: 'error' }
  return { texture: entry.texture, status: 'ready' }
}

/** Icon only when loaded; otherwise shortLabel — never both. */
export function resolveKeycapLegendMode(
  hasIcon: boolean,
  status: SvgTextureStatus,
): 'icon' | 'label' {
  if (hasIcon && status === 'ready') return 'icon'
  return 'label'
}

/** Test helper — clears the module cache between cases. */
export function __resetSvgTextureCacheForTests() {
  for (const entry of textureCache.values()) {
    if (entry.status === 'ready') entry.texture.dispose()
  }
  textureCache.clear()
  inflight.clear()
}
