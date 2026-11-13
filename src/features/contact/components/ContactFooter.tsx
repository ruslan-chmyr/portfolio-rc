import { navigatePortfolioSection } from '../../../app/portfolio'
import logoOnDarkBg from '../../../assets/rc-logo-white.svg'
import logoOnLightBg from '../../../assets/rc-logo-dark.svg'
import { portfolioLogoSrc, useTheme } from '../../../shared/theme'
import { CONTACT_CONFIG } from '../model/contactConfig'

export function ContactFooter() {
  const { theme } = useTheme()
  const logoSrc = portfolioLogoSrc(theme, {
    onDarkBg: logoOnDarkBg,
    onLightBg: logoOnLightBg,
  })

  const onTop = () => {
    // Settled About (bio visible) — not Intro hero / early type frame.
    navigatePortfolioSection('about')
  }

  return (
    <footer className="contact-footer" data-contact-footer>
      <div className="contact-footer__rule" aria-hidden="true" />
      <div className="contact-footer__row">
        <div className="contact-footer__brand">
          <span className="contact-footer__logo-wrap" aria-hidden="true">
            <img
              className="contact-footer__logo"
              src={logoSrc}
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
          <span className="contact-footer__top-label">Back to top</span>
          <span className="contact-footer__top-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <path
                d="M8 12.5V3.5M8 3.5 3.75 7.75M8 3.5l4.25 4.25"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </footer>
  )
}
