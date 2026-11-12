import { useEffect, useRef } from 'react'
import type {
  SpectralDrapeAvailability,
  SpectralDrapeFallback,
} from '../lib/createSpectralDrapeFallback'

/**
 * Contact decorative backdrop.
 *
 * React Bits Pro Spectral Drape is license-gated and not installed here.
 * Lazily loads an original Three.js particle-fabric approximation once Contact
 * approaches the viewport. CSS fallback keeps the section visually complete if
 * WebGL cannot initialize or the context is lost.
 */
export function ContactBackground() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return

    let cancelled = false
    let starting = false
    let controller: SpectralDrapeFallback | undefined
    let observer: IntersectionObserver | undefined
    let resizeObserver: ResizeObserver | undefined
    let usesWindowResize = false
    let resizeRaf = 0
    let inView = false
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const supportsResizeObserver = typeof ResizeObserver !== 'undefined'

    const setFabricMode = (mode: 'css' | 'webgl') => {
      if (cancelled) return
      root.dataset.fabric = mode
    }

    const failToCss = () => {
      resizeObserver?.disconnect()
      resizeObserver = undefined
      if (usesWindowResize) {
        window.removeEventListener('resize', scheduleResize)
        usesWindowResize = false
      }
      if (resizeRaf) {
        window.cancelAnimationFrame(resizeRaf)
        resizeRaf = 0
      }
      controller?.dispose()
      controller = undefined
      setFabricMode('css')
    }

    const onAvailability = (state: SpectralDrapeAvailability) => {
      if (cancelled) return
      if (state === 'ready') {
        setFabricMode('webgl')
        return
      }
      // context-lost / failed → keep Contact usable via CSS fallback.
      setFabricMode('css')
      if (state === 'failed') {
        failToCss()
      }
    }

    const syncPause = () => {
      controller?.setPaused(!inView || motionMq.matches)
    }

    const onMotionChange = () => {
      controller?.setReducedMotion(motionMq.matches)
      syncPause()
    }

    const scheduleResize = () => {
      if (!controller || cancelled) return
      if (resizeRaf) return
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0
        if (!controller || cancelled) return
        controller.resize()
      })
    }

    const attachResize = () => {
      if (resizeObserver || usesWindowResize) return
      if (supportsResizeObserver) {
        try {
          resizeObserver = new ResizeObserver(() => scheduleResize())
          resizeObserver.observe(root)
          return
        } catch {
          // Fall through to window resize.
        }
      }
      window.addEventListener('resize', scheduleResize)
      usesWindowResize = true
    }

    const startWebGl = async () => {
      if (cancelled || starting || controller) return
      starting = true
      try {
        const { createSpectralDrapeFallback } = await import(
          '../lib/createSpectralDrapeFallback'
        )
        if (cancelled) return
        controller = createSpectralDrapeFallback(canvas, {
          reducedMotion: motionMq.matches,
          onAvailability,
        })
        if (cancelled) {
          controller.dispose()
          controller = undefined
          return
        }
        setFabricMode('webgl')
        syncPause()
        attachResize()
      } catch {
        failToCss()
      } finally {
        starting = false
      }
    }

    setFabricMode('css')

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          inView = Boolean(entry?.isIntersecting)
          if (inView) void startWebGl()
          syncPause()
        },
        // Preload before Contact fully enters so the fabric is ready on arrival.
        { root: null, threshold: 0.01, rootMargin: '40% 0px 20% 0px' },
      )
      const section = root.closest('section') ?? root
      observer.observe(section)
    } else {
      inView = true
      void startWebGl()
    }

    motionMq.addEventListener('change', onMotionChange)

    return () => {
      cancelled = true
      motionMq.removeEventListener('change', onMotionChange)
      observer?.disconnect()
      resizeObserver?.disconnect()
      if (usesWindowResize) {
        window.removeEventListener('resize', scheduleResize)
      }
      if (resizeRaf) window.cancelAnimationFrame(resizeRaf)
      controller?.dispose()
      controller = undefined
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="contact-background"
      data-fabric="css"
      aria-hidden="true"
    >
      <div className="contact-background__fallback" />
      <canvas ref={canvasRef} className="contact-background__canvas" />
      <div className="contact-background__veil" />
    </div>
  )
}
