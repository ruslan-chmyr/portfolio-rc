import logoSrc from '../../../assets/rc-logo-white.svg'
import type { ProjectBookEntry } from '../model/projectBookData'

const PAGE_W = 1024
const PAGE_H = 1440

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
  ctx.fillStyle = '#f4f1ea'
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  const grad = ctx.createLinearGradient(0, 0, PAGE_W, PAGE_H)
  grad.addColorStop(0, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(0,0,0,0.04)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
}

type PaintNotify = () => void

/** Rasterize the visual (left) page for a project spread. */
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

  const img = new Image()
  img.decoding = 'async'
  ctx.fillStyle = '#1a2233'
  ctx.fillRect(72, 120, PAGE_W - 144, PAGE_H - 320)

  const drawCover = () => {
    try {
      const pad = 72
      const boxW = PAGE_W - pad * 2
      const boxH = PAGE_H - 320
      const iw = img.naturalWidth || boxW
      const ih = img.naturalHeight || boxH
      const scale = Math.max(boxW / iw, boxH / ih)
      const dw = iw * scale
      const dh = ih * scale
      const dx = pad + (boxW - dw) / 2
      const dy = 120 + (boxH - dh) / 2
      ctx.save()
      ctx.beginPath()
      ctx.rect(pad, 120, boxW, boxH)
      ctx.clip()
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
    } catch {
      /* ignore decode failures */
    }
    onPaint?.()
  }

  img.onload = drawCover
  img.src = entry.coverImage
  if (img.complete && img.naturalWidth > 0) drawCover()

  ctx.fillStyle = 'rgba(20,24,32,0.72)'
  ctx.font = '600 28px Inter, system-ui, sans-serif'
  ctx.fillText(entry.number, 72, PAGE_H - 100)
  ctx.font = '500 36px Inter, system-ui, sans-serif'
  ctx.fillText(entry.title, 72, PAGE_H - 52)

  return canvas
}

/** Rasterize the editorial (right) page for a project spread. */
export function createProjectDetailPageCanvas(
  entry: ProjectBookEntry,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_W
  canvas.height = PAGE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  paintPaper(ctx)

  let y = 120
  ctx.fillStyle = '#8a93a3'
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillText(`${entry.number}  /  PROJECT`, 72, y)
  y += 70

  ctx.fillStyle = '#141820'
  ctx.font = '650 54px Inter, system-ui, sans-serif'
  y = wrapText(ctx, entry.title, 72, y, PAGE_W - 144, 62, 3) + 24

  ctx.fillStyle = '#4a5568'
  ctx.font = '400 28px Inter, system-ui, sans-serif'
  y = wrapText(ctx, entry.summary, 72, y, PAGE_W - 144, 40, 3) + 36

  const section = (label: string, body?: string) => {
    if (!body) return
    ctx.fillStyle = '#8a93a3'
    ctx.font = '650 20px Inter, system-ui, sans-serif'
    ctx.fillText(label.toUpperCase(), 72, y)
    y += 36
    ctx.fillStyle = '#2a3344'
    ctx.font = '400 26px Inter, system-ui, sans-serif'
    y = wrapText(ctx, body, 72, y, PAGE_W - 144, 36, 5) + 28
  }

  if (entry.role) section('Focus', entry.role)
  section('Challenge', entry.challenge)
  section('Solution', entry.solution)
  section('Result', entry.results)

  if (entry.technologies.length) {
    ctx.fillStyle = '#8a93a3'
    ctx.font = '650 20px Inter, system-ui, sans-serif'
    ctx.fillText('TECHNOLOGIES', 72, y)
    y += 40
    ctx.fillStyle = '#2a3344'
    ctx.font = '500 24px Inter, system-ui, sans-serif'
    y = wrapText(ctx, entry.technologies.join('  ·  '), 72, y, PAGE_W - 144, 34, 3)
  }

  return canvas
}

export function createCoverCanvas(
  args: {
    title: string
    years: string
  },
  onPaint?: PaintNotify,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_W
  canvas.height = PAGE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const bg = ctx.createLinearGradient(0, 0, PAGE_W, PAGE_H)
  bg.addColorStop(0, '#1a1c20')
  bg.addColorStop(0.5, '#121418')
  bg.addColorStop(1, '#0a0b0d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  ctx.strokeStyle = 'rgba(200,205,215,0.18)'
  ctx.lineWidth = 2
  ctx.strokeRect(48, 48, PAGE_W - 96, PAGE_H - 96)

  const logo = new Image()
  logo.decoding = 'async'
  const drawLogo = () => {
    try {
      const lw = 220
      const lh = (logo.naturalHeight / Math.max(1, logo.naturalWidth)) * lw
      ctx.globalAlpha = 0.78
      ctx.drawImage(logo, (PAGE_W - lw) / 2, PAGE_H * 0.28 - lh / 2, lw, lh)
      ctx.globalAlpha = 1
    } catch {
      /* ignore */
    }
    onPaint?.()
  }
  logo.onload = drawLogo
  logo.src = logoSrc
  if (logo.complete && logo.naturalWidth > 0) drawLogo()

  ctx.fillStyle = 'rgba(220,225,235,0.82)'
  ctx.font = '650 42px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(args.title, PAGE_W / 2, PAGE_H * 0.58)

  ctx.fillStyle = 'rgba(180,188,200,0.55)'
  ctx.font = '500 28px Inter, system-ui, sans-serif'
  ctx.fillText(args.years, PAGE_W / 2, PAGE_H * 0.64)
  ctx.textAlign = 'left'

  return canvas
}
