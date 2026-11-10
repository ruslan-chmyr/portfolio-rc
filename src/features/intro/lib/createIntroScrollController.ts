import { clamp01 } from './introMath'
import type { IntroScrollHandoff } from './createIntroScrollHandoff'

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
  handoff?: IntroScrollHandoff
}

export type IntroScrollController = {
  getProgress: () => number
  dispose: () => void
}

export function createIntroScrollController({
  distancePx,
  keyboardStep,
  onProgress,
  handoff,
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

    const portfolioActive = handoff && !handoff.isCapturing()
    if (portfolioActive) {
      if (window.scrollY <= 0 && event.deltaY < 0) {
        handoff.reengage()
      } else {
        return
      }
    }

    const multiplier =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
    const delta = event.deltaY * multiplier

    if (
      handoff &&
      handoff.isCapturing() &&
      progress >= 1 &&
      delta > 0
    ) {
      handoff.releaseForward()
      return
    }

    if (event.cancelable) event.preventDefault()
    move(delta)
  }

  const onTouchStart = (event: TouchEvent) => {
    previousTouchY = event.touches.length === 1 ? event.touches[0].clientY : null
  }

  const onTouchMove = (event: TouchEvent) => {
    if (previousTouchY === null || event.touches.length !== 1) return
    const y = event.touches[0].clientY
    const delta = previousTouchY - y
    previousTouchY = y

    if (handoff && !handoff.isCapturing()) {
      if (window.scrollY <= 0 && delta < 0) handoff.reengage()
      else return
    }

    if (
      handoff &&
      handoff.isCapturing() &&
      progress >= 1 &&
      delta > 0
    ) {
      handoff.releaseForward()
      return
    }

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

    if (handoff && !handoff.isCapturing()) {
      const reverseKey =
        event.key === 'ArrowUp' ||
        event.key === 'PageUp' ||
        (event.key === ' ' && event.shiftKey)
      if (reverseKey && window.scrollY <= 0) {
        handoff.reengage()
        if (event.cancelable) event.preventDefault()
      }
      return
    }

    let next: number | null = null
    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
        if (handoff && progress >= 1) {
          handoff.releaseForward()
          return
        }
        next = progress + keyboardStep
        break
      case 'ArrowUp':
      case 'PageUp':
        next = progress - keyboardStep
        break
      case ' ':
        if (!event.shiftKey && handoff && progress >= 1) {
          handoff.releaseForward()
          return
        }
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
