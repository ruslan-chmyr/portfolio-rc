import { useEffect, type RefObject } from 'react'

const INFLUENCE_PX = 175
const MAX_OFFSET_PX = 42
const WORD_OFFSET_PX = 22
const MAX_ROTATE_DEG = 7
const FOLLOW_RATE = 11.5
const EXTRA_GAP_PX = 14

type Vec = { x: number; y: number }
type WordMotion = { x: number; y: number; rot: number }

function canRepel(): boolean {
  if (typeof window === 'undefined') return false
  return (
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !window.matchMedia('(pointer: coarse)').matches
  )
}

function repelFromPointer(
  clientX: number,
  clientY: number,
  cx: number,
  cy: number,
  pushScale: number,
): Vec & { t: number } {
  const dx = cx - clientX
  const dy = cy - clientY
  const dist = Math.hypot(dx, dy)
  if (dist >= INFLUENCE_PX) return { x: 0, y: 0, t: 0 }
  const t = 1 - dist / INFLUENCE_PX
  const push = t * t * pushScale
  const inv = dist > 1e-4 ? 1 / dist : 0
  return { x: dx * inv * push, y: dy * inv * push, t }
}

export function useScrollHintRepel(hintRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!canRepel()) return
    const el = hintRef.current
    if (!el) return

    let raf = 0
    let last = performance.now()
    let targetContainer: Vec = { x: 0, y: 0 }
    let currentContainer: Vec = { x: 0, y: 0 }
    let targetGap = 0
    let currentGap = 0
    let targetOpacity = 1
    let currentOpacity = 1

    const getWords = () => [...el.querySelectorAll<HTMLElement>('.intro-scroll-hint__word')]
    let wordEls = getWords()
    let targetWords: WordMotion[] = wordEls.map(() => ({ x: 0, y: 0, rot: 0 }))
    let currentWords: WordMotion[] = wordEls.map(() => ({ x: 0, y: 0, rot: 0 }))

    const syncWords = () => {
      wordEls = getWords()
      if (targetWords.length !== wordEls.length) {
        targetWords = wordEls.map(() => ({ x: 0, y: 0, rot: 0 }))
        currentWords = wordEls.map(() => ({ x: 0, y: 0, rot: 0 }))
      }
    }

    const apply = () => {
      const moving =
        Math.abs(currentContainer.x) > 0.1 ||
        Math.abs(currentContainer.y) > 0.1 ||
        currentGap > 0.2 ||
        Math.abs(currentOpacity - 1) > 0.01 ||
        currentWords.some((w) => Math.abs(w.x) > 0.1 || Math.abs(w.rot) > 0.05)

      if (!moving) {
        el.style.removeProperty('transform')
        el.style.removeProperty('gap')
        el.style.removeProperty('opacity')
        for (const word of wordEls) word.style.removeProperty('transform')
        return
      }

      el.style.transform = `translate3d(${currentContainer.x.toFixed(2)}px, ${currentContainer.y.toFixed(2)}px, 0)`
      el.style.gap = `calc(clamp(0.45rem, 1.1vw, 0.75rem) + ${currentGap.toFixed(2)}px)`
      el.style.opacity = `${currentOpacity.toFixed(3)}`

      wordEls.forEach((word, i) => {
        const w = currentWords[i]
        if (!w || (Math.abs(w.x) < 0.08 && Math.abs(w.y) < 0.08 && Math.abs(w.rot) < 0.05)) {
          word.style.removeProperty('transform')
          return
        }
        word.style.transform = `translate3d(${w.x.toFixed(2)}px, ${w.y.toFixed(2)}px, 0) rotate(${w.rot.toFixed(2)}deg)`
      })
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const follow = 1 - Math.exp(-dt * FOLLOW_RATE)

      currentContainer.x += (targetContainer.x - currentContainer.x) * follow
      currentContainer.y += (targetContainer.y - currentContainer.y) * follow
      currentGap += (targetGap - currentGap) * follow
      currentOpacity += (targetOpacity - currentOpacity) * follow

      for (let i = 0; i < currentWords.length; i += 1) {
        const cur = currentWords[i]
        const tgt = targetWords[i] ?? { x: 0, y: 0, rot: 0 }
        cur.x += (tgt.x - cur.x) * follow
        cur.y += (tgt.y - cur.y) * follow
        cur.rot += (tgt.rot - cur.rot) * follow
      }

      apply()

      const containerSettled =
        Math.hypot(currentContainer.x - targetContainer.x, currentContainer.y - targetContainer.y) < 0.08 &&
        Math.abs(currentGap - targetGap) < 0.08 &&
        Math.abs(currentOpacity - targetOpacity) < 0.01
      const wordsSettled = currentWords.every((w, i) => {
        const t = targetWords[i]
        if (!t) return true
        return (
          Math.hypot(w.x - t.x, w.y - t.y) < 0.08 &&
          Math.abs(w.rot - t.rot) < 0.08
        )
      })

      if (!containerSettled || !wordsSettled) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }

    const startLoop = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const reset = () => {
      targetContainer = { x: 0, y: 0 }
      targetGap = 0
      targetOpacity = 1
      targetWords = wordEls.map(() => ({ x: 0, y: 0, rot: 0 }))
      startLoop()
    }

    const onMove = (event: PointerEvent) => {
      syncWords()
      const rect = el.getBoundingClientRect()
      const padded =
        event.clientX >= rect.left - INFLUENCE_PX * 0.4 &&
        event.clientX <= rect.right + INFLUENCE_PX * 0.4 &&
        event.clientY >= rect.top - INFLUENCE_PX * 0.4 &&
        event.clientY <= rect.bottom + INFLUENCE_PX * 0.4

      if (!padded) {
        reset()
        return
      }

      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const group = repelFromPointer(event.clientX, event.clientY, cx, cy, MAX_OFFSET_PX)

      if (group.t <= 0) {
        reset()
        return
      }

      targetContainer = { x: group.x, y: group.y }
      targetGap = group.t * EXTRA_GAP_PX
      targetOpacity = 1 - group.t * group.t * 0.22

      targetWords = wordEls.map((word) => {
        const wr = word.getBoundingClientRect()
        const wx = wr.left + wr.width / 2
        const wy = wr.top + wr.height / 2
        const w = repelFromPointer(event.clientX, event.clientY, wx, wy, WORD_OFFSET_PX)
        const dx = wx - event.clientX
        const dy = wy - event.clientY
        const tilt =
          Math.atan2(dy, dx) * (180 / Math.PI) * 0.032 * w.t * MAX_ROTATE_DEG
        return { x: w.x, y: w.y, rot: tilt }
      })

      startLoop()
    }

    const onBlur = () => reset()

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('blur', onBlur)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('blur', onBlur)
      targetContainer = { x: 0, y: 0 }
      currentContainer = { x: 0, y: 0 }
      currentGap = 0
      currentOpacity = 1
      currentWords = wordEls.map(() => ({ x: 0, y: 0, rot: 0 }))
      apply()
    }
  }, [hintRef])
}
