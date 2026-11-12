import { useEffect, useRef, type RefObject } from 'react'
import { publishTrailingCursorRing } from '../../../shared/pointer/trailingCursorBridge'
import {
  resolveTrailingCursorMode,
  type TrailingCursorMode,
} from '../lib/resolveTrailingCursorMode'

const RING_FOLLOW_RATE = 9.5

function canUseTrailingCursor(): boolean {
  if (typeof window === 'undefined') return false
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !window.matchMedia('(pointer: coarse)').matches
  )
}

export function useTrailingCursor(enabled: boolean): {
  rootRef: RefObject<HTMLDivElement | null>
  dotRef: RefObject<HTMLDivElement | null>
  ringRef: RefObject<HTMLDivElement | null>
  supported: boolean
} {
  const rootRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const supported = enabled && canUseTrailingCursor()

  const target = useRef({ x: -100, y: -100 })
  const ring = useRef({ x: -100, y: -100 })
  const visible = useRef(false)
  const seeded = useRef(false)
  const mode = useRef<TrailingCursorMode>('default')

  useEffect(() => {
    if (!supported) return

    document.documentElement.classList.add('intro-custom-cursor')
    let raf = 0
    let last = performance.now()

    const applyMode = (next: TrailingCursorMode) => {
      if (mode.current === next) return
      mode.current = next
      rootRef.current?.setAttribute('data-mode', next)
      document.documentElement.setAttribute('data-cursor-mode', next)
    }

    const setVisible = (on: boolean) => {
      visible.current = on
      const opacity = on ? '1' : '0'
      dotRef.current?.style.setProperty('opacity', opacity)
      ringRef.current?.style.setProperty('opacity', opacity)
      if (!on) {
        applyMode('default')
        publishTrailingCursorRing(ring.current.x, ring.current.y, false)
      }
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

    const syncModeFromPoint = () => {
      const el = document.elementFromPoint(target.current.x, target.current.y)
      const next = resolveTrailingCursorMode(el)
      applyMode(next)
      // Hide decorative cursor over form fields so the system I-beam remains usable.
      if (next === 'native') {
        dotRef.current?.style.setProperty('opacity', '0')
        ringRef.current?.style.setProperty('opacity', '0')
      } else if (visible.current) {
        dotRef.current?.style.setProperty('opacity', '1')
        ringRef.current?.style.setProperty('opacity', '1')
      }
    }

    const onMove = (event: PointerEvent) => {
      target.current.x = event.clientX
      target.current.y = event.clientY
      if (!seeded.current) {
        ring.current.x = event.clientX
        ring.current.y = event.clientY
        seeded.current = true
        placeRing(ring.current.x, ring.current.y)
        publishTrailingCursorRing(ring.current.x, ring.current.y, true)
      }
      placeDot(event.clientX, event.clientY)
      applyMode(resolveTrailingCursorMode(event.target))
      if (mode.current === 'native') {
        dotRef.current?.style.setProperty('opacity', '0')
        ringRef.current?.style.setProperty('opacity', '0')
        visible.current = true
      } else {
        setVisible(true)
      }
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const onLeave = () => setVisible(false)

    const onScroll = () => {
      if (!visible.current) return
      syncModeFromPoint()
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let needsFrame = visible.current && mode.current !== 'native'
      if (visible.current && mode.current !== 'native') {
        const follow = 1 - Math.exp(-dt * RING_FOLLOW_RATE)
        ring.current.x += (target.current.x - ring.current.x) * follow
        ring.current.y += (target.current.y - ring.current.y) * follow
        placeRing(ring.current.x, ring.current.y)
        publishTrailingCursorRing(ring.current.x, ring.current.y, true)
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
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    applyMode('default')

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('scroll', onScroll, true)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('intro-custom-cursor')
      document.documentElement.removeAttribute('data-cursor-mode')
      publishTrailingCursorRing(-100, -100, false)
    }
  }, [supported])

  return { rootRef, dotRef, ringRef, supported }
}
