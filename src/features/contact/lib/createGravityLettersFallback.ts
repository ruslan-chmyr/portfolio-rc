import gsap from 'gsap'

/**
 * Lightweight interactive letter fallback for React Bits Pro “Gravity Letters”.
 * Original GSAP scatter/return — not the Pro sand-physics implementation.
 */

export type GravityLettersFallback = {
  dispose: () => void
  setEnabled: (enabled: boolean) => void
}

export function createGravityLettersFallback(
  root: HTMLElement,
  options?: { reducedMotion?: boolean },
): GravityLettersFallback {
  const letters = Array.from(
    root.querySelectorAll<HTMLElement>('[data-gravity-letter]'),
  )

  let disposed = false
  let enabled = letters.length > 0 && !options?.reducedMotion
  const home = letters

  const clearTransforms = () => {
    gsap.killTweensOf(home)
    gsap.set(home, { x: 0, y: 0, rotation: 0, clearProps: 'transform' })
  }

  if (letters.length === 0) {
    return {
      dispose: () => undefined,
      setEnabled: () => undefined,
    }
  }

  home.forEach((el) => {
    gsap.set(el, { x: 0, y: 0, rotation: 0, force3D: true })
  })

  const onMove = (event: PointerEvent) => {
    if (disposed || !enabled) return
    const mx = event.clientX
    const my = event.clientY

    home.forEach((el) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = cx - mx
      const dy = cy - my
      const dist = Math.hypot(dx, dy)
      const influence = Math.max(0, 1 - dist / 140)
      if (influence <= 0.01) {
        gsap.to(el, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.55,
          ease: 'power3.out',
          overwrite: 'auto',
        })
        return
      }
      const force = influence * influence
      gsap.to(el, {
        x: (dx / (dist || 1)) * force * 28,
        y: (dy / (dist || 1)) * force * 36 + force * 10,
        rotation: (dx > 0 ? 1 : -1) * force * 18,
        duration: 0.28,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    })
  }

  const onLeave = () => {
    if (disposed || !enabled) return
    home.forEach((el) => {
      gsap.to(el, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.55)',
        overwrite: 'auto',
      })
    })
  }

  const bind = () => {
    root.addEventListener('pointermove', onMove)
    root.addEventListener('pointerleave', onLeave)
  }

  const unbind = () => {
    root.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerleave', onLeave)
  }

  if (enabled) bind()

  return {
    setEnabled: (next) => {
      if (disposed) return
      if (next === enabled) return
      enabled = next
      if (!enabled) {
        unbind()
        clearTransforms()
        return
      }
      home.forEach((el) => {
        gsap.set(el, { x: 0, y: 0, rotation: 0, force3D: true })
      })
      bind()
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      unbind()
      clearTransforms()
    },
  }
}
