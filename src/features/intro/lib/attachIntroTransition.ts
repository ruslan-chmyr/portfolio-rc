import gsap from 'gsap'
import { INTRO_POINTER, INTRO_SCROLL, INTRO_TRANSITION } from '../model/introConfig'
import { createIntroScrollController } from './createIntroScrollController'
import { clamp01, smooth01 } from './introMath'
import type { IntroRuntime } from './introRuntime'

export type IntroTransitionHandle = {
  dispose: () => void
}

export function attachIntroTransition(runtime: IntroRuntime): IntroTransitionHandle {
  const {
    root,
    transitionCanvas,
    canvas,
    mark,
    bloom,
    displacement,
    useSvgFallback,
    renderer,
    reducedMotion,
    inkTransition,
    bloomScale,
    liquidState,
  } = runtime

  const ctx = gsap.context(() => {
    gsap.set(transitionCanvas, { opacity: 0 })
    gsap.set(canvas, { opacity: useSvgFallback ? 0 : 1, scale: 1, transformOrigin: '50% 50%' })
    gsap.set(mark, {
      scale: 1,
      svgOrigin: '300 160',
      opacity: useSvgFallback ? 1 : 0,
    })
    gsap.set(bloom, { scale: 0.001, svgOrigin: '300 160', opacity: 1 })
    gsap.set(displacement, { attr: { scale: 0 } })

    if (!reducedMotion && renderer) {
      gsap.to(liquidState, {
        strength: INTRO_POINTER.strengthTarget,
        duration: INTRO_POINTER.strengthDuration,
        ease: 'sine.out',
      })
    }
  }, root)

  let captureInFlight = false
  let warmIdleId: number | ReturnType<typeof globalThis.setTimeout> | null = null

  const scheduleWarmSeed = () => {
    if (!inkTransition || runtime.reducedMotion) return
    const warm = () => {
      if (runtime.transitionProgress === 0) inkTransition.warmSeedCache(canvas)
    }
    if (typeof globalThis.requestIdleCallback === 'function') {
      warmIdleId = globalThis.requestIdleCallback(warm, { timeout: 2500 })
    } else {
      warmIdleId = globalThis.setTimeout(warm, 1200)
    }
  }
  scheduleWarmSeed()

  const applyProgress = (rawProgress: number) => {
    const progress = clamp01(rawProgress)
    runtime.transitionProgress = progress
    root.dataset.scrollProgress = progress.toFixed(3)

    if (progress > 0 && !runtime.capturedTransition && inkTransition && !captureInFlight) {
      captureInFlight = true
      void inkTransition.captureAsync(canvas).then((ok) => {
        captureInFlight = false
        runtime.capturedTransition = ok
        if (ok) runtime.transitionStartTime = performance.now()
        applyProgress(runtime.transitionProgress)
      })
    }

    if (progress === 0) {
      runtime.capturedTransition = false
    }

    if (runtime.capturedTransition && inkTransition) {
      inkTransition.render(
        progress,
        reducedMotion ? 0 : (performance.now() - runtime.transitionStartTime) / 1000,
      )
      gsap.set(transitionCanvas, { opacity: progress > 0 ? 1 : 0 })
      gsap.set(canvas, { opacity: progress > 0 ? 0 : 1, scale: 1 })
      gsap.set(mark, { opacity: 0 })
      gsap.set(bloom, { scale: 0.001, svgOrigin: '300 160' })
    } else {
      gsap.set(transitionCanvas, { opacity: 0 })
      const grow = smooth01(progress)
      const bloomT = smooth01(
        clamp01(
          (progress - INTRO_TRANSITION.scrollBloomStart) /
            (1 - INTRO_TRANSITION.scrollBloomStart),
        ),
      )
      const bloomSize = 0.001 + bloomT * (bloomScale - 0.001)
      gsap.set(bloom, { scale: bloomSize, svgOrigin: '300 160' })

      if (!useSvgFallback) {
        gsap.set(canvas, {
          scale: 1 + 0.6 * grow,
          opacity:
            1 -
            smooth01(
              clamp01(
                (progress - INTRO_TRANSITION.canvasFadeStart) /
                  (1 - INTRO_TRANSITION.canvasFadeStart),
              ),
            ),
        })
        gsap.set(mark, { opacity: 0 })
      } else {
        gsap.set(mark, { scale: 1 + 0.6 * grow, opacity: 1 })
      }
    }

    root.classList.toggle('intro-animation--complete', progress >= 1)
    if (progress === 0) {
      runtime.pointer.x = runtime.target.x
      runtime.pointer.y = runtime.target.y
      runtime.lastFramePointer.x = runtime.pointer.x
      runtime.lastFramePointer.y = runtime.pointer.y
    }
  }

  const scroll = createIntroScrollController({
    distancePx: () =>
      Math.max(
        INTRO_SCROLL.minDistancePx,
        window.innerHeight * INTRO_SCROLL.distanceViewportFactor,
      ),
    keyboardStep: INTRO_SCROLL.keyboardStep,
    onProgress: applyProgress,
  })

  return {
    dispose: () => {
      if (warmIdleId !== null) {
        if (typeof globalThis.requestIdleCallback === 'function') {
          globalThis.cancelIdleCallback(warmIdleId as number)
        } else {
          globalThis.clearTimeout(warmIdleId)
        }
      }
      scroll.dispose()
      ctx.revert()
    },
  }
}
