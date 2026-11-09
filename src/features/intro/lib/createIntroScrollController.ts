import { clamp01 } from './introMath'

/**
 * Owns the intro's *virtual scroll position*.
 * This is intentionally feature-local: a future page-scroll coordinator can
 * hand off control after the first real page section is mounted.
 */
export type IntroScrollControllerOptions = {
  /** Pixels of physical scrolling needed to cross the entire intro. */
  distancePx: () => number
  keyboardStep: number
  onProgress: (progress: number) => void
}

export type IntroScrollController = {
  getProgress: () => number
  dispose: () => void
}

export function createIntroScrollController({
  distancePx,
  keyboardStep,
  onProgress,
}: IntroScrollControllerOptions): IntroScrollController {
  let progress = 0
  let previousTouchY: number | null = null

  const setProgress = (next: number) => {
    const clamped = clamp01(next)
    if (clamped === progress) return
    progress = clamped
    onProgress(progress)
  }

  const move = (deltaPixels: number) => {
    if (!Number.isFinite(deltaPixels) || deltaPixels === 0) return
    setProgress(progress + deltaPixels / Math.max(1, distancePx()))
  }

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return // Preserve the browser's pinch-to-zoom gesture.
    if (event.cancelable) event.preventDefault()
    const multiplier =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
    move(event.deltaY * multiplier)
  }

  const onTouchStart = (event: TouchEvent) => {
    previousTouchY = event.touches.length === 1 ? event.touches[0].clientY : null
  }

  const onTouchMove = (event: TouchEvent) => {
    if (previousTouchY === null || event.touches.length !== 1) return
    const y = event.touches[0].clientY
    const delta = previousTouchY - y
    previousTouchY = y
    if (event.cancelable) event.preventDefault()
    move(delta)
  }

  const onTouchEnd = () => {
    previousTouchY = null
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
    ) return

    let next: number | null = null
    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
        next = progress + keyboardStep
        break
      case 'ArrowUp':
      case 'PageUp':
        next = progress - keyboardStep
        break
      case ' ':
        next = progress + (event.shiftKey ? -keyboardStep : keyboardStep)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = 1
        break
      default:
        return
    }
    if (event.cancelable) event.preventDefault()
    setProgress(next)
  }

  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
  window.addEventListener('touchcancel', onTouchEnd)
  window.addEventListener('keydown', onKeyDown)

  // Give the caller the initial, stable value exactly once.
  onProgress(progress)

  return {
    getProgress: () => progress,
    dispose() {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    },
  }
}
