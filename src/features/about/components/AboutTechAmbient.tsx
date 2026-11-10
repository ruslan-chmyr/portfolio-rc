import { useEffect, useRef } from 'react'
import architectureUrl from '../assets/architecture.svg'
import nextjsUrl from '../assets/nextjs.svg'
import reactUrl from '../assets/react.svg'
import typescriptUrl from '../assets/typescript.svg'
import '../styles/about-tech-ambient.css'

const GLYPHS = [
  {
    id: 'react',
    mask: reactUrl,
    motionClass: 'about-tech-ambient__motion--rotate',
    itemClass: 'about-tech-ambient__item--react',
  },
  {
    id: 'nextjs',
    mask: nextjsUrl,
    motionClass: 'about-tech-ambient__motion--float-y',
    itemClass: 'about-tech-ambient__item--nextjs',
  },
  {
    id: 'typescript',
    mask: typescriptUrl,
    motionClass: 'about-tech-ambient__motion--drift',
    itemClass: 'about-tech-ambient__item--typescript',
  },
  {
    id: 'architecture',
    mask: architectureUrl,
    motionClass: 'about-tech-ambient__motion--float-diag',
    itemClass: 'about-tech-ambient__item--architecture',
  },
] as const

export function AboutTechAmbient() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const section = root.closest<HTMLElement>('.about-section')
    if (!section) return

    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    let inView = false

    const syncPaused = () => {
      root.classList.toggle('about-tech-ambient--paused', !inView || reducedMq.matches)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false
        syncPaused()
      },
      { root: null, threshold: 0.08 },
    )

    observer.observe(section)

    const onReducedChange = () => syncPaused()
    reducedMq.addEventListener('change', onReducedChange)
    syncPaused()

    return () => {
      observer.disconnect()
      reducedMq.removeEventListener('change', onReducedChange)
    }
  }, [])

  return (
    <div ref={rootRef} className="about-tech-ambient" aria-hidden>
      <div className="about-tech-ambient__reveal">
        {GLYPHS.map((glyph) => (
          <div key={glyph.id} className={`about-tech-ambient__item ${glyph.itemClass}`}>
            <div className={`about-tech-ambient__motion ${glyph.motionClass}`}>
              <img className="about-tech-ambient__glyph" src={glyph.mask} alt="" decoding="async" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
