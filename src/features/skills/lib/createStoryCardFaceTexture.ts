export type StoryCardFaceContent = {
  coverSrc: string
  eyebrow?: string
  title?: string
  subtitle?: string
  cta?: string
}

export type StoryCardFaceOptions = {
  width: number
  height: number
  /** Device pixel ratio clamp — keeps text sharp without oversized GPU uploads. */
  pixelRatio?: number
  cornerRadius?: number
}

const MAX_TEXTURE_EDGE = 1280

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = words[0] ?? ''
  for (let i = 1; i < words.length; i += 1) {
    const word = words[i] ?? ''
    const next = `${current} ${word}`
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load card cover: ${src.slice(0, 64)}`))
    image.src = src
  })
}

export function buildStoryCardFaceCacheKey(
  content: StoryCardFaceContent,
  options: Pick<StoryCardFaceOptions, 'width' | 'height' | 'pixelRatio' | 'cornerRadius'>,
): string {
  return [
    content.coverSrc,
    content.eyebrow ?? '',
    content.title ?? '',
    content.subtitle ?? '',
    content.cta ?? '',
    Math.round(options.width),
    Math.round(options.height),
    (options.pixelRatio ?? 1).toFixed(2),
    Math.round(options.cornerRadius ?? 0),
  ].join('|')
}

/**
 * Bake cover artwork + story typography into one raster surface.
 * The result is applied across curved carousel tiles so text and art share geometry.
 */
export async function createStoryCardFaceTexture(
  content: StoryCardFaceContent,
  options: StoryCardFaceOptions,
): Promise<string> {
  const cssW = Math.max(1, Math.round(options.width))
  const cssH = Math.max(1, Math.round(options.height))
  const dpr = Math.min(Math.max(options.pixelRatio ?? 1, 1), 2.5)
  const scale = Math.min(1, MAX_TEXTURE_EDGE / Math.max(cssW * dpr, cssH * dpr))
  const pixelW = Math.max(1, Math.round(cssW * dpr * scale))
  const pixelH = Math.max(1, Math.round(cssH * dpr * scale))
  const sx = pixelW / cssW
  const sy = pixelH / cssH

  const canvas = document.createElement('canvas')
  canvas.width = pixelW
  canvas.height = pixelH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable for story card faces')

  ctx.setTransform(sx, 0, 0, sy, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const radius = Math.max(0, options.cornerRadius ?? 24)
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.arcTo(cssW, 0, cssW, cssH, radius)
  ctx.arcTo(cssW, cssH, 0, cssH, radius)
  ctx.arcTo(0, cssH, 0, 0, radius)
  ctx.arcTo(0, 0, cssW, 0, radius)
  ctx.closePath()
  ctx.clip()

  try {
    const cover = await loadImage(content.coverSrc)
    ctx.drawImage(cover, 0, 0, cssW, cssH)
  } catch {
    const fallback = ctx.createLinearGradient(0, 0, cssW, cssH)
    fallback.addColorStop(0, '#1A3A6B')
    fallback.addColorStop(1, '#3A2A6A')
    ctx.fillStyle = fallback
    ctx.fillRect(0, 0, cssW, cssH)
  }

  // Top + bottom scrims for readable type on any cover.
  const topScrim = ctx.createLinearGradient(0, 0, 0, cssH * 0.34)
  topScrim.addColorStop(0, 'rgba(5, 10, 20, 0.42)')
  topScrim.addColorStop(1, 'rgba(5, 10, 20, 0)')
  ctx.fillStyle = topScrim
  ctx.fillRect(0, 0, cssW, cssH * 0.34)

  const bottomScrim = ctx.createLinearGradient(0, cssH * 0.42, 0, cssH)
  bottomScrim.addColorStop(0, 'rgba(5, 10, 20, 0)')
  bottomScrim.addColorStop(0.35, 'rgba(5, 10, 20, 0.35)')
  bottomScrim.addColorStop(1, 'rgba(5, 10, 20, 0.82)')
  ctx.fillStyle = bottomScrim
  ctx.fillRect(0, cssH * 0.42, cssW, cssH * 0.58)

  const padX = Math.max(18, cssW * 0.055)
  const padY = Math.max(18, cssH * 0.045)
  const textWidth = cssW - padX * 2

  const setLetterSpacing = (value: string) => {
    const typed = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
    if ('letterSpacing' in typed) typed.letterSpacing = value
  }

  if (content.eyebrow) {
    ctx.fillStyle = 'rgba(244, 247, 251, 0.78)'
    ctx.font = `600 ${Math.max(11, cssW * 0.032)}px Inter, ui-sans-serif, system-ui, sans-serif`
    ctx.textBaseline = 'top'
    setLetterSpacing('0.16em')
    ctx.fillText(content.eyebrow.toUpperCase(), padX, padY, textWidth)
    setLetterSpacing('0px')
  }

  const titleSize = Math.max(22, Math.min(34, cssW * 0.078))
  const subtitleSize = Math.max(13, Math.min(17, cssW * 0.042))
  const ctaSize = Math.max(10, Math.min(13, cssW * 0.032))
  const lineGap = 1.18

  let cursorY = cssH - padY

  if (content.cta) {
    ctx.fillStyle = 'rgba(94, 231, 255, 0.92)'
    ctx.font = `600 ${ctaSize}px Inter, ui-sans-serif, system-ui, sans-serif`
    ctx.textBaseline = 'bottom'
    setLetterSpacing('0.14em')
    ctx.fillText(content.cta.toUpperCase(), padX, cursorY, textWidth)
    setLetterSpacing('0px')
    cursorY -= ctaSize + 10
  }

  if (content.subtitle) {
    ctx.fillStyle = 'rgba(197, 206, 218, 0.94)'
    ctx.font = `400 ${subtitleSize}px Inter, ui-sans-serif, system-ui, sans-serif`
    ctx.textBaseline = 'bottom'
    const lines = wrapLines(ctx, content.subtitle, textWidth).slice(0, 3)
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      ctx.fillText(lines[i] ?? '', padX, cursorY, textWidth)
      cursorY -= subtitleSize * lineGap
    }
    cursorY -= 8
  }

  if (content.title) {
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${titleSize}px Inter, ui-sans-serif, system-ui, sans-serif`
    ctx.textBaseline = 'bottom'
    const lines = wrapLines(ctx, content.title, textWidth).slice(0, 3)
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      ctx.fillText(lines[i] ?? '', padX, cursorY, textWidth)
      cursorY -= titleSize * lineGap
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), 'image/webp', 0.92)
  })
  if (blob) return URL.createObjectURL(blob)
  return canvas.toDataURL('image/webp', 0.92)
}
