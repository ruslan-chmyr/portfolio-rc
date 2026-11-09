import { useEffect, type RefObject } from 'react'

const INFLUENCE_PX = 128
const MAX_SCALE = 1.42
const CURVE_POWER = 1.45
const FOLLOW_RATE = 10.5
const LIFT_PX = 5

function canUseLetterBulge(): boolean {
  if (typeof window === 'undefined') return false
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !window.matchMedia('(pointer: coarse)').matches
  )
}

export function useCaptionLetterBulge(
  captionRef: RefObject<HTMLElement | null>,
): { enabled: boolean } {
  const enabled = canUseLetterBulge()

  useEffect(() => {
    if (!enabled) return
    const root = captionRef.current
    if (!root) return

    type LetterNode = { el: HTMLElement; center: number }
    const targets = new Map<HTMLElement, number>()
    const currents = new Map<HTMLElement, number>()

    let raf = 0
    let last = performance.now()
    let hovering = false

    const collect = (): LetterNode[] => {
      const nodes = root.querySelectorAll<HTMLElement>('[data-caption-letter]')
      return [...nodes].map((el) => {
        const rect = el.getBoundingClientRect()
        if (!currents.has(el)) currents.set(el, 1)
        if (!targets.has(el)) targets.set(el, 1)
        return { el, center: rect.left + rect.width / 2 }
      })
    }

    const setTargetScales = (clientX: number, items: LetterNode[]) => {
      for (const { el, center } of items) {
        const dist = Math.abs(clientX - center)
        if (dist >= INFLUENCE_PX) {
          targets.set(el, 1)
          continue
        }
        const t = 1 - dist / INFLUENCE_PX
        const weight = Math.pow(t, CURVE_POWER)
        targets.set(el, 1 + (MAX_SCALE - 1) * weight)
      }
    }

    const applyScale = (el: HTMLElement, scale: number) => {
      if (scale <= 1.001) {
        el.style.removeProperty('transform')
        return
      }
      const lift = (scale - 1) * LIFT_PX
      el.style.transform = `translateY(${(-lift).toFixed(2)}px) scale(${scale.toFixed(3)})`
    }

    const resetAll = () => {
      for (const el of currents.keys()) {
        targets.set(el, 1)
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const follow = 1 - Math.exp(-dt * FOLLOW_RATE)

      let animating = hovering
      for (const [el, target] of targets) {
        const current = currents.get(el) ?? 1
        const next = current + (target - current) * follow
        currents.set(el, next)
        applyScale(el, next)
        if (Math.abs(next - target) > 0.004 || target > 1.004) animating = true
      }

      if (hovering || animating) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
        for (const el of currents.keys()) {
          currents.set(el, 1)
          applyScale(el, 1)
        }
      }
    }

    const startLoop = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const onEnter = () => {
      hovering = true
      collect()
      startLoop()
    }

    const onMove = (event: PointerEvent) => {
      const items = collect()
      setTargetScales(event.clientX, items)
      if (!hovering) onEnter()
      else if (!raf) startLoop()
    }

    const onLeave = () => {
      hovering = false
      resetAll()
      startLoop()
    }

    const onResize = () => {
      if (hovering) collect()
    }

    collect()
    root.addEventListener('pointerenter', onEnter)
    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      root.removeEventListener('pointerenter', onEnter)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      for (const el of currents.keys()) applyScale(el, 1)
    }
  }, [enabled, captionRef])

  return { enabled }
}
