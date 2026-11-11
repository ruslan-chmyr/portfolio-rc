import logoOnDarkBg from '../../../assets/rc-logo-white.svg'
import logoOnLightBg from '../../../assets/rc-logo-dark.svg'
import { CONTACT_CONFIG } from '../model/contactConfig'

export function ContactFooter() {
  const onTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <footer className="contact-footer" data-contact-footer>
      <div className="contact-footer__rule" aria-hidden="true" />
      <div className="contact-footer__row">
        <div className="contact-footer__brand">
          <span className="contact-footer__logo-wrap" aria-hidden="true">
            <img
              className="contact-footer__logo contact-footer__logo--on-dark-bg"
              src={logoOnDarkBg}
              alt=""
              width={36}
              height={36}
            />
            <img
              className="contact-footer__logo contact-footer__logo--on-light-bg"
              src={logoOnLightBg}
              alt=""
              width={36}
              height={36}
            />
          </span>
          <div>
            <p className="contact-footer__copy">{CONTACT_CONFIG.copyright}</p>
            <p className="contact-footer__tagline">{CONTACT_CONFIG.tagline}</p>
          </div>
        </div>
        <button type="button" className="contact-footer__top" onClick={onTop}>
          Back to top
        </button>
      </div>
    </footer>
  )
}
