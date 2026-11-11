import gsap from 'gsap'

/**
 * Lightweight interactive letter fallback for React Bits Pro “Gravity Letters”.
 * Original GSAP scatter/return — not the Pro sand-physics implementation.
 */

export type GravityLettersFallback = {
  dispose: () => void
}

export function createGravityLettersFallback(
  root: HTMLElement,
  options?: { reducedMotion?: boolean },
): GravityLettersFallback {
  const letters = Array.from(
    root.querySelectorAll<HTMLElement>('[data-gravity-letter]'),
  )
  if (letters.length === 0 || options?.reducedMotion) {
    return { dispose: () => undefined }
  }

  let disposed = false
  const home = letters.map((el) => {
    gsap.set(el, { x: 0, y: 0, rotation: 0, display3D: true })
    return el
  })

  const onMove = (event: PointerEvent) => {
    if (disposed) return
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
    if (disposed) return
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

  root.addEventListener('pointermove', onMove)
  root.addEventListener('pointerleave', onLeave)

  return {
    dispose: () => {
      if (disposed) return
      disposed = true
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(home)
      gsap.set(home, { clearProps: 'transform' })
    },
  }
}
