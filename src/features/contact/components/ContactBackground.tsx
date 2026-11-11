import { useEffect, useRef } from 'react'
import type { SpectralDrapeFallback } from '../lib/createSpectralDrapeFallback'

/**
 * Contact decorative backdrop.
 *
 * React Bits Pro Spectral Drape is license-gated and not installed here.
 * Lazily loads an original Three.js particle-fabric approximation instead —
 * never claim this is the Pro component.
 */
export function ContactBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let controller: SpectralDrapeFallback | undefined
    let observer: IntersectionObserver | undefined
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncPause = (inView: boolean) => {
      controller?.setPaused(!inView || motionMq.matches)
    }

    const onMotionChange = () => {
      const section = canvas.closest('section')
      const rect = section?.getBoundingClientRect()
      const inView = rect
        ? rect.bottom > 0 && rect.top < window.innerHeight
        : true
      syncPause(inView)
    }

    void import('../lib/createSpectralDrapeFallback').then(
      ({ createSpectralDrapeFallback }) => {
        if (cancelled) return
        controller = createSpectralDrapeFallback(canvas, {
          reducedMotion: motionMq.matches,
        })

        const section = canvas.closest('section')
        if (section && 'IntersectionObserver' in window) {
          observer = new IntersectionObserver(
            ([entry]) => {
              syncPause(Boolean(entry?.isIntersecting))
            },
            // Expand upward so the Experience bleed stays animated.
            { root: null, threshold: 0.02, rootMargin: '22% 0px 12% 0px' },
          )
          observer.observe(section)
        }
      },
    )

    motionMq.addEventListener('change', onMotionChange)

    return () => {
      cancelled = true
      motionMq.removeEventListener('change', onMotionChange)
      observer?.disconnect()
      controller?.dispose()
    }
  }, [])

  return (
    <div className="contact-background" aria-hidden="true">
      <canvas ref={canvasRef} className="contact-background__canvas" />
      <div className="contact-background__veil" />
    </div>
  )
}
