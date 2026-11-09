import { useRef } from 'react'
import { useCaptionLetterBulge } from '../../hooks/useCaptionLetterBulge'
import './IntroCaption.css'

const CAPTION_LABEL = 'Portfolio · Ruslan Chmyr · Senior Frontend Developer'

const SEGMENTS = ['Portfolio', 'Ruslan Chmyr', 'Senior Frontend Developer'] as const

function CaptionLetters({ text }: { text: string }) {
  return (
    <>
      {[...text].map((char, index) => (
      <span
        key={`${char}-${index}`}
        className="intro-caption__letter"
        data-caption-letter
      >
        {char === ' ' ? '\u00a0' : char}
      </span>
      ))}
    </>
  )
}

export function IntroCaption() {
  const captionRef = useRef<HTMLParagraphElement>(null)
  useCaptionLetterBulge(captionRef)

  return (
    <p ref={captionRef} className="intro-caption" aria-label={CAPTION_LABEL}>
      <span className="intro-caption__line" aria-hidden="true">
        {SEGMENTS.map((segment, index) => (
          <span key={segment} className="intro-caption__segment">
            {index > 0 ? (
              <span className="intro-caption__sep" aria-hidden="true">
                ·
              </span>
            ) : null}
            <CaptionLetters text={segment} />
          </span>
        ))}
      </span>
    </p>
  )
}
