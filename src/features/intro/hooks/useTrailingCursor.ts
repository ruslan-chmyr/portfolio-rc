import { useEffect, useRef, type RefObject } from 'react'

const RING_FOLLOW_RATE = 9.5

function canUseTrailingCursor(): boolean {
  if (typeof window === 'undefined') return false
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !window.matchMedia('(pointer: coarse)').matches
  )
}

export function useTrailingCursor(enabled: boolean): {
  dotRef: RefObject<HTMLDivElement | null>
  ringRef: RefObject<HTMLDivElement | null>
  supported: boolean
} {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const supported = enabled && canUseTrailingCursor()

  const target = useRef({ x: -100, y: -100 })
  const ring = useRef({ x: -100, y: -100 })
  const visible = useRef(false)
  const seeded = useRef(false)

  useEffect(() => {
    if (!supported) return

    document.documentElement.classList.add('intro-custom-cursor')
    let raf = 0
    let last = performance.now()

    const setVisible = (on: boolean) => {
      visible.current = on
      const opacity = on ? '1' : '0'
      dotRef.current?.style.setProperty('opacity', opacity)
      ringRef.current?.style.setProperty('opacity', opacity)
    }

    const placeDot = (x: number, y: number) => {
      dotRef.current?.style.setProperty(
        'transform',
        `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
      )
    }

    const placeRing = (x: number, y: number) => {
      ringRef.current?.style.setProperty(
        'transform',
        `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
      )
    }

    const onMove = (event: PointerEvent) => {
      target.current.x = event.clientX
      target.current.y = event.clientY
      if (!seeded.current) {
        ring.current.x = event.clientX
        ring.current.y = event.clientY
        seeded.current = true
        placeRing(ring.current.x, ring.current.y)
      }
      placeDot(event.clientX, event.clientY)
      setVisible(true)
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const onLeave = () => setVisible(false)

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let needsFrame = visible.current
      if (visible.current) {
        const follow = 1 - Math.exp(-dt * RING_FOLLOW_RATE)
        ring.current.x += (target.current.x - ring.current.x) * follow
        ring.current.y += (target.current.y - ring.current.y) * follow
        placeRing(ring.current.x, ring.current.y)
        const lag = Math.hypot(
          target.current.x - ring.current.x,
          target.current.y - ring.current.y,
        )
        needsFrame = lag > 0.35
      }
      raf = needsFrame ? requestAnimationFrame(tick) : 0
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('blur', onLeave)
    document.documentElement.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('blur', onLeave)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('intro-custom-cursor')
    }
  }, [supported])

  return { dotRef, ringRef, supported }
}
