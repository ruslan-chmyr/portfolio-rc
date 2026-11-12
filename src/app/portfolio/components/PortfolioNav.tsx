import { useEffect, useId, useRef, useState } from 'react'
import logoOnDarkBg from '../../../assets/rc-logo-white.svg'
import logoOnLightBg from '../../../assets/rc-logo-dark.svg'
import {
  EXPERIENCE_CV_PDF_URL,
  isExperienceCvPdfConfigured,
} from '../../../features/experience/model/experienceConfig'
import { portfolioLogoSrc, useTheme } from '../../../shared/theme'
import { ThemeToggle } from '../../../shared/ui/ThemeToggle/ThemeToggle'
import { usePortfolioNavigation } from '../hooks/usePortfolioNavigation'
import { navigatePortfolioSection } from '../lib/navigatePortfolioSection'
import {
  findPortfolioSection,
  formatPortfolioSectionLabel,
  PORTFOLIO_NAV_SECTIONS,
} from '../lib/portfolioSections'
import '../styles/portfolio-chrome.css'

export function PortfolioNav() {
  const { theme } = useTheme()
  const { mode, activeSection, surface } = usePortfolioNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const immersive = surface === 'immersive'
  const logoSrc = immersive
    ? logoOnDarkBg
    : portfolioLogoSrc(theme, {
        onDarkBg: logoOnDarkBg,
        onLightBg: logoOnLightBg,
      })

  const resumeConfigured = isExperienceCvPdfConfigured(EXPERIENCE_CV_PDF_URL)
  const activeEntry = findPortfolioSection(
    activeSection === 'intro' ? 'about' : activeSection,
  )
  const activeLabel = activeEntry
    ? formatPortfolioSectionLabel(activeEntry.number, activeEntry.title)
    : '01 / About'

  const menuVisible = mode === 'compact' && menuOpen

  useEffect(() => {
    if (!menuVisible) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (menuRef.current?.contains(target)) return
      if (menuButtonRef.current?.contains(target)) return
      setMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuVisible])

  const goTo = (id: (typeof PORTFOLIO_NAV_SECTIONS)[number]['id']) => {
    setMenuOpen(false)
    navigatePortfolioSection(id)
  }

  return (
    <header
      className="portfolio-chrome"
      data-mode={mode}
      data-surface={surface}
      data-active-section={activeSection}
      aria-hidden={mode === 'intro' ? true : undefined}
    >
      <nav className="portfolio-nav" aria-label="Primary">
        <a
          className="portfolio-nav__brand"
          href="#about-heading"
          onClick={(event) => {
            event.preventDefault()
            goTo('about')
          }}
        >
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

        {mode === 'compact' && activeSection !== 'about' ? (
          <p className="portfolio-nav__section" aria-live="polite">
            {activeLabel}
          </p>
        ) : null}

        <div className="portfolio-nav__end">
          {mode === 'standard' ? (
            <ul className="portfolio-nav__links">
              <li>
                {resumeConfigured ? (
                  <a
                    href={EXPERIENCE_CV_PDF_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Resume
                  </a>
                ) : (
                  <span className="portfolio-nav__soon" title="Resume coming soon">
                    Resume
                  </span>
                )}
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(event) => {
                    event.preventDefault()
                    goTo('contact')
                  }}
                >
                  Contact
                </a>
              </li>
            </ul>
          ) : null}

          {mode === 'compact' ? (
            <div className="portfolio-nav__menu" ref={menuRef}>
              <button
                ref={menuButtonRef}
                type="button"
                className="portfolio-nav__menu-toggle"
                aria-expanded={menuVisible}
                aria-controls={menuId}
                aria-haspopup="true"
                aria-label={
                  menuVisible ? 'Close sections menu' : 'Open sections menu'
                }
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span aria-hidden>{menuVisible ? 'Close' : 'Menu'}</span>
              </button>
              {menuVisible ? (
                <ul id={menuId} className="portfolio-nav__menu-list" role="list">
                  {PORTFOLIO_NAV_SECTIONS.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.targetId}`}
                        aria-current={
                          activeSection === section.id ? 'page' : undefined
                        }
                        onClick={(event) => {
                          event.preventDefault()
                          goTo(section.id)
                        }}
                      >
                        {formatPortfolioSectionLabel(
                          section.number,
                          section.title,
                        )}
                      </a>
                    </li>
                  ))}
                  <li>
                    {resumeConfigured ? (
                      <a
                        href={EXPERIENCE_CV_PDF_URL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Resume
                      </a>
                    ) : (
                      <span className="portfolio-nav__soon">Resume</span>
                    )}
                  </li>
                </ul>
              ) : null}
            </div>
          ) : null}

          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
