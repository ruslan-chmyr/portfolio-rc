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

    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarseMq = window.matchMedia('(pointer: coarse)')
    const controller = createGravityLettersFallback(root, {
      reducedMotion: motionMq.matches || coarseMq.matches,
    })

    const syncEnabled = () => {
      controller.setEnabled(!(motionMq.matches || coarseMq.matches))
    }

    motionMq.addEventListener('change', syncEnabled)
    coarseMq.addEventListener('change', syncEnabled)

    return () => {
      motionMq.removeEventListener('change', syncEnabled)
      coarseMq.removeEventListener('change', syncEnabled)
      controller.dispose()
    }
  }, [])

  const interactive = CONTACT_CONFIG.headingLineTwo

  return (
    <h2
      id="contact-heading"
      className="contact-heading"
      aria-label={`${CONTACT_CONFIG.headingLineOne} ${interactive}`}
    >
      <span className="contact-heading__line" aria-hidden="true">
        {CONTACT_CONFIG.headingLineOne}
      </span>
      <span
        className="contact-heading__line contact-heading__line--interactive"
        aria-hidden="true"
      >
        <span
          ref={interactiveRef}
          className="contact-heading__gravity"
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
