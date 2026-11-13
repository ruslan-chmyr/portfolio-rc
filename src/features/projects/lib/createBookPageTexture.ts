import { CanvasTexture, SRGBColorSpace } from 'three'
import logoSrc from '../../../assets/rc-logo-white.svg'
import type { ProjectBookEntry } from '../model/projectBookData'

const PAGE_W = 1024
const PAGE_H = 1408
const FONT = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'
const PAPER = '#f7f4ef'

type PaintNotify = () => void

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/)
  let line = ''
  let cursorY = y
  let lines = 0
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY)
      line = word
      cursorY += lineHeight
      lines += 1
      if (lines >= maxLines) return cursorY
    } else {
      line = test
    }
  }
  if (line && lines < maxLines) {
    ctx.fillText(line, x, cursorY)
    cursorY += lineHeight
  }
  return cursorY
}

function paintPaper(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  const sheen = ctx.createLinearGradient(0, 0, PAGE_W, PAGE_H)
  sheen.addColorStop(0, 'rgba(255,255,255,0.4)')
  sheen.addColorStop(0.55, 'rgba(255,255,255,0)')
  sheen.addColorStop(1, 'rgba(30,28,24,0.04)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = img.naturalWidth || w
  const ih = img.naturalHeight || h
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/** Left spread — near full-bleed visual (paper placeholder, never charcoal). */
export function createProjectVisualPageCanvas(
  entry: ProjectBookEntry,
  onPaint?: PaintNotify,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_W
  canvas.height = PAGE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  paintPaper(ctx)

  const margin = 36
  const frameX = margin
  const frameY = margin
  const frameW = PAGE_W - margin * 2
  const frameH = PAGE_H - margin * 2

  // Soft warm placeholder — if the image is late, page must not read as black.
  const ph = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH)
  ph.addColorStop(0, '#d8dee8')
  ph.addColorStop(1, '#b7c0d0')
  ctx.fillStyle = ph
  ctx.fillRect(frameX, frameY, frameW, frameH)

  const img = new Image()
  img.decoding = 'async'
  const paint = () => {
    try {
      // Re-paint paper rim then image so async redraw stays clean.
      paintPaper(ctx)
      drawCoverImage(ctx, img, frameX, frameY, frameW, frameH)
    } catch {
      /* ignore decode failures — keep placeholder */
    }
    const vig = ctx.createLinearGradient(
      0,
      frameY + frameH * 0.72,
      0,
      frameY + frameH,
    )
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,0.28)')
    ctx.fillStyle = vig
    ctx.fillRect(frameX, frameY, frameW, frameH)

    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = `600 24px ${FONT}`
    ctx.fillText(entry.number, frameX + 24, frameY + frameH - 28)
    onPaint?.()
  }
  img.onload = paint
  img.onerror = () => onPaint?.()
  img.src = entry.coverImage
  if (img.complete && img.naturalWidth > 0) paint()

  return canvas
}

/**
 * Right spread — editorial hierarchy only.
 * Long challenge/solution/outcome live in the HTML details overlay.
 */
export function createProjectDetailPageCanvas(
  entry: ProjectBookEntry,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_W
  canvas.height = PAGE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  paintPaper(ctx)

  const mx = 64
  let y = 88

  ctx.fillStyle = '#9a9388'
  ctx.font = `600 18px ${FONT}`
  ctx.fillText(`${entry.number}  ·  PROJECT`, mx, y)
  y += 58

  ctx.fillStyle = '#14120f'
  ctx.font = `700 56px ${FONT}`
  y = wrapText(ctx, entry.title, mx, y, PAGE_W - mx * 2, 62, 3) + 24

  ctx.fillStyle = '#5c564c'
  ctx.font = `400 28px ${FONT}`
  y = wrapText(ctx, entry.summary, mx, y, PAGE_W - mx * 2, 40, 4) + 44

  if (entry.role) {
    ctx.fillStyle = '#9a9388'
    ctx.font = `600 16px ${FONT}`
    ctx.fillText('FOCUS', mx, y)
    y += 32
    ctx.fillStyle = '#2a2620'
    ctx.font = `500 26px ${FONT}`
    ctx.fillText(entry.role, mx, y)
    y += 52
  }

  if (entry.technologies.length) {
    ctx.fillStyle = '#9a9388'
    ctx.font = `600 16px ${FONT}`
    ctx.fillText('TECHNOLOGIES', mx, y)
    y += 38

    const chips = entry.technologies.slice(0, 6)
    let cx = mx
    let cy = y
    ctx.font = `500 20px ${FONT}`
    for (const tech of chips) {
      const tw = ctx.measureText(tech).width + 36
      if (cx + tw > PAGE_W - mx) {
        cx = mx
        cy += 48
      }
      ctx.strokeStyle = 'rgba(40,36,30,0.18)'
      ctx.lineWidth = 1.5
      roundRect(ctx, cx, cy - 26, tw, 40, 20)
      ctx.stroke()
      ctx.fillStyle = '#2a2620'
      ctx.fillText(tech, cx + 18, cy)
      cx += tw + 12
    }
  }

  return canvas
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function createCoverCanvas(
  args: { title: string; years: string },
  onPaint?: PaintNotify,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_W
  canvas.height = PAGE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bg = ctx.createLinearGradient(0, 0, PAGE_W, PAGE_H)
  bg.addColorStop(0, '#2a2c30')
  bg.addColorStop(0.45, '#1a1c1f')
  bg.addColorStop(1, '#0e0f11')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  ctx.fillRect(0, 0, PAGE_W, PAGE_H * 0.35)

  ctx.strokeStyle = 'rgba(198,204,214,0.22)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(64, 64, PAGE_W - 128, PAGE_H - 128)

  const logo = new Image()
  logo.decoding = 'async'
  const drawLogo = () => {
    try {
      const lw = 200
      const lh = (logo.naturalHeight / Math.max(1, logo.naturalWidth)) * lw
      ctx.save()
      ctx.globalAlpha = 0.72
      ctx.drawImage(logo, (PAGE_W - lw) / 2, PAGE_H * 0.3 - lh / 2, lw, lh)
      ctx.restore()
    } catch {
      /* ignore */
    }
    onPaint?.()
  }
  logo.onload = drawLogo
  logo.onerror = () => onPaint?.()
  logo.src = logoSrc
  if (logo.complete && logo.naturalWidth > 0) drawLogo()

  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(220,224,230,0.9)'
  ctx.font = `600 36px ${FONT}`
  ctx.fillText(args.title, PAGE_W / 2, PAGE_H * 0.58)

  ctx.fillStyle = 'rgba(170,176,186,0.55)'
  ctx.font = `500 24px ${FONT}`
  ctx.fillText(args.years, PAGE_W / 2, PAGE_H * 0.64)
  ctx.textAlign = 'left'

  return canvas
}

/** Plain charcoal back board for the final sheet. */
export function createBackCoverCanvas(onPaint?: PaintNotify): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_W
  canvas.height = PAGE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bg = ctx.createLinearGradient(0, 0, PAGE_W, PAGE_H)
  bg.addColorStop(0, '#22252a')
  bg.addColorStop(1, '#0c0d10')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  ctx.strokeStyle = 'rgba(198,204,214,0.16)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(64, 64, PAGE_W - 128, PAGE_H - 128)
  ctx.fillStyle = 'rgba(180,186,196,0.45)'
  ctx.font = `500 22px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText('RC', PAGE_W / 2, PAGE_H * 0.52)
  ctx.textAlign = 'left'
  onPaint?.()
  return canvas
}

/** Build a CanvasTexture from a painted face canvas. */
export function canvasToTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 4
  map.needsUpdate = true
  return map
}

