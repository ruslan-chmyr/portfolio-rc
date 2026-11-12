import { clamp01 } from './introMath'
import type { IntroScrollHandoff } from './createIntroScrollHandoff'
import {
  INTRO_OVERSCROLL_ARM_PX,
  INTRO_OVERSCROLL_COMMIT,
  INTRO_OVERSCROLL_COOLDOWN_MS,
  INTRO_OVERSCROLL_IDLE_MS,
  INTRO_OVERSCROLL_MAX_PX,
  overscrollTension,
  resistOverscrollPull,
  shouldCommitOverscroll,
} from './introOverscroll'

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
  /**
   * Rubber-band pull while at progress 0.
   * `tension` is 0–1; `displayPx` is the resisted translate to apply.
   */
  onOverscrollPull?: (tension: number, displayPx: number) => void
  /** Fired when pull crosses the commit threshold (theme toggle). */
  onOverscrollCommit?: () => void
  /** Fired when an incomplete pull springs back to rest. */
  onOverscrollCancel?: () => void
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
  onOverscrollPull,
  onOverscrollCommit,
  onOverscrollCancel,
  handoff,
}: IntroScrollControllerOptions): IntroScrollController {
  let progress = 0
  let previousTouchY: number | null = null
  let rawPullPx = 0
  let lastCommitAt = 0
  let idleTimer = 0

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

  const clearIdleTimer = () => {
    if (idleTimer) {
      globalThis.clearTimeout(idleTimer)
      idleTimer = 0
    }
  }

  const publishPull = () => {
    const displayPx = resistOverscrollPull(rawPullPx)
    const tension = overscrollTension(displayPx)
    onOverscrollPull?.(tension, displayPx)
    return { displayPx, tension }
  }

  const resetPull = (notifyCancel: boolean) => {
    clearIdleTimer()
    const hadPull = rawPullPx > 0
    rawPullPx = 0
    if (hadPull) {
      onOverscrollPull?.(0, 0)
      if (notifyCancel) onOverscrollCancel?.()
    }
  }

  const commitPull = () => {
    clearIdleTimer()
    rawPullPx = 0
    lastCommitAt = performance.now()
    onOverscrollPull?.(0, 0)
    onOverscrollCommit?.()
  }

  const scheduleIdleRelease = () => {
    if (!onOverscrollPull && !onOverscrollCancel) return
    clearIdleTimer()
    idleTimer = globalThis.setTimeout(() => {
      idleTimer = 0
      if (rawPullPx <= 0 || progress > 0) return
      const tension = overscrollTension(resistOverscrollPull(rawPullPx))
      if (shouldCommitOverscroll(tension)) {
        commitPull()
        return
      }
      resetPull(true)
    }, INTRO_OVERSCROLL_IDLE_MS)
  }

  const applyOverscrollDelta = (deltaPixels: number) => {
    if (!onOverscrollPull && !onOverscrollCommit) return false
    if (progress > 0) {
      if (rawPullPx > 0) resetPull(true)
      return false
    }

    // Upward scroll increases pull; downward eases it back.
    if (deltaPixels < 0) {
      const now = performance.now()
      if (now - lastCommitAt < INTRO_OVERSCROLL_COOLDOWN_MS) {
        scheduleIdleRelease()
        return true
      }
      rawPullPx += Math.abs(deltaPixels)
      const { tension } = publishPull()
      if (shouldCommitOverscroll(tension)) {
        commitPull()
        return true
      }
      scheduleIdleRelease()
      return true
    }

    if (rawPullPx > 0) {
      rawPullPx = Math.max(0, rawPullPx - deltaPixels)
      if (rawPullPx <= INTRO_OVERSCROLL_ARM_PX) {
        resetPull(true)
      } else {
        publishPull()
        scheduleIdleRelease()
      }
      return true
    }

    return false
  }

  /** Keyboard: one decisive tug toward commit. */
  const keyboardOverscrollNudge = () => {
    if (progress > 0) return
    const now = performance.now()
    if (now - lastCommitAt < INTRO_OVERSCROLL_COOLDOWN_MS) return
    rawPullPx = Math.max(
      rawPullPx,
      INTRO_OVERSCROLL_MAX_PX * INTRO_OVERSCROLL_COMMIT + 8,
    )
    const { tension } = publishPull()
    if (shouldCommitOverscroll(tension)) commitPull()
    else scheduleIdleRelease()
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
    if (applyOverscrollDelta(delta)) return
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
    if (applyOverscrollDelta(delta)) return
    move(delta)
  }

  const onTouchEnd = () => {
    previousTouchY = null
    if (progress > 0 || rawPullPx <= 0) return
    const tension = overscrollTension(resistOverscrollPull(rawPullPx))
    if (shouldCommitOverscroll(tension)) commitPull()
    else resetPull(true)
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
        if (progress <= 0) {
          if (event.cancelable) event.preventDefault()
          keyboardOverscrollNudge()
          return
        }
        next = progress - keyboardStep
        break
      case ' ':
        if (!event.shiftKey && handoff && progress >= 1) {
          handoff.releaseForward()
          return
        }
        if (event.shiftKey && progress <= 0) {
          if (event.cancelable) event.preventDefault()
          keyboardOverscrollNudge()
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
    if (rawPullPx > 0) resetPull(true)
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
      clearIdleTimer()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    },
  }
}
