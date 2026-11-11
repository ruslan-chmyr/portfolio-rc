import { useEffect, useRef } from 'react'
import { createGravityLettersFallback } from '../lib/createGravityLettersFallback'
import { CONTACT_CONFIG } from '../model/contactConfig'

/**
 * Contact headline. “in mind?” uses an original GSAP letter reaction fallback
 * (React Bits Pro Gravity Letters is license-gated and not installed).
 */
export function ContactHeading() {
  const interactiveRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = interactiveRef.current
    if (!root) return
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    const controller = createGravityLettersFallback(root, {
      reducedMotion: reducedMotion || isCoarse,
    })
    return () => controller.dispose()
  }, [])

  const interactive = CONTACT_CONFIG.headingLineTwo

  return (
    <h2 id="contact-heading" className="contact-heading">
      <span className="contact-heading__line">{CONTACT_CONFIG.headingLineOne}</span>
      <span className="contact-heading__line contact-heading__line--interactive">
        <span className="visually-hidden">{interactive}</span>
        <span
          ref={interactiveRef}
          className="contact-heading__gravity"
          aria-hidden="true"
        >
          {Array.from(interactive).map((char, index) => (
            <span
              key={`${char}-${index}`}
              className={
                char === ' '
                  ? 'contact-heading__space'
                  : 'contact-heading__letter'
              }
              data-gravity-letter={char === ' ' ? undefined : true}
            >
              {char === ' ' ? '\u00a0' : char}
            </span>
          ))}
        </span>
      </span>
    </h2>
  )
}
