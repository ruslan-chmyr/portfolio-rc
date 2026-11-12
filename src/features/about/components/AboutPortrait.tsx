import portrait240Avif from '../../../assets/me/portrait-240.avif'
import portrait240Webp from '../../../assets/me/portrait-240.webp'
import portrait480Avif from '../../../assets/me/portrait-480.avif'
import portrait480Webp from '../../../assets/me/portrait-480.webp'
import portrait720Avif from '../../../assets/me/portrait-720.avif'
import portrait720Jpg from '../../../assets/me/portrait-720.jpg'
import portrait720Webp from '../../../assets/me/portrait-720.webp'

/**
 * Display width tracks About CSS:
 * - mobile: clamp(190px, 58vw, 260px)
 * - desktop column: clamp(9.5rem, 22vw, 15.5rem) ≈ 152–248px
 * Provide 240 / 480 / 720 sources for 1× / 2× / 3× DPR.
 *
 * Not the measured LCP element (hero type is); deferred until near viewport
 * so Intro does not compete with a multi‑MB portrait download.
 */
const PORTRAIT_SIZES =
  '(max-width: 700px) min(58vw, 260px), min(22vw, 15.5rem)'

const AVIF_SRCSET = `${portrait240Avif} 240w, ${portrait480Avif} 480w, ${portrait720Avif} 720w`
const WEBP_SRCSET = `${portrait240Webp} 240w, ${portrait480Webp} 480w, ${portrait720Webp} 720w`

export function AboutPortrait() {
  return (
    <figure className="about-portrait">
      <div className="about-portrait__frame">
        <picture>
          <source type="image/avif" srcSet={AVIF_SRCSET} sizes={PORTRAIT_SIZES} />
          <source type="image/webp" srcSet={WEBP_SRCSET} sizes={PORTRAIT_SIZES} />
          <img
            className="about-portrait__image"
            src={portrait720Jpg}
            alt="Ruslan Chmyr"
            width={400}
            height={500}
            sizes={PORTRAIT_SIZES}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </picture>
      </div>
      <figcaption className="visually-hidden">Portrait of Ruslan Chmyr</figcaption>
    </figure>
  )
}
