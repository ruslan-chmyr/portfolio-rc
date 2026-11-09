import { useRef } from 'react'
import { useScrollHintRepel } from '../../hooks/useScrollHintRepel'
import './IntroScrollHint.css'

export function IntroScrollHint() {
  const hintRef = useRef<HTMLParagraphElement>(null)
  useScrollHintRepel(hintRef)

  return (
    <p ref={hintRef} className="intro-scroll-hint">
      <span className="intro-scroll-hint__word">Scroll</span>
      <span className="intro-scroll-hint__word">Down</span>
    </p>
  )
}
