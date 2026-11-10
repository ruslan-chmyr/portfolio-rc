import logoOnDarkBg from '../../../assets/rc-logo-white.svg'
import logoOnLightBg from '../../../assets/rc-logo-dark.svg'
import { ThemeToggle } from '../../../shared/ui/ThemeToggle/ThemeToggle'
export function PortfolioNav() {
  return (
    <nav className="portfolio-nav" aria-label="Primary">
      <a className="portfolio-nav__brand" href="#about-heading">
        <span className="portfolio-nav__logo-wrap">
          <img
            className="portfolio-nav__logo portfolio-nav__logo--on-dark-bg"
            src={logoOnDarkBg}
            width={40}
            height={40}
            alt="RC"
          />
          <img
            className="portfolio-nav__logo portfolio-nav__logo--on-light-bg"
            src={logoOnLightBg}
            width={40}
            height={40}
            alt=""
            aria-hidden
          />
        </span>
        <span className="portfolio-nav__rule" aria-hidden />
      </a>
      <div className="portfolio-nav__end">
        <ul className="portfolio-nav__links">
          <li>
            <span className="portfolio-nav__soon">Resume</span>
          </li>
          <li>
            <span className="portfolio-nav__soon">Contact</span>
          </li>
        </ul>
        <ThemeToggle />
      </div>
    </nav>
  )
}
