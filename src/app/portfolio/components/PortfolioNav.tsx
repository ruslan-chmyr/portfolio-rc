import logoOnDarkBg from '../../../assets/rc-logo-white.svg'
import logoOnLightBg from '../../../assets/rc-logo-dark.svg'
import { useTheme } from '../../../shared/theme'
import { ThemeToggle } from '../../../shared/ui/ThemeToggle/ThemeToggle'

export function PortfolioNav() {
  const { theme } = useTheme()
  const logoSrc = theme === 'dark' ? logoOnDarkBg : logoOnLightBg

  return (
    <nav className="portfolio-nav" aria-label="Primary">
      <a className="portfolio-nav__brand" href="#about-heading">
        <span className="portfolio-nav__logo-wrap">
          <img
            className="portfolio-nav__logo"
            src={logoSrc}
            width={40}
            height={40}
            alt="RC"
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
