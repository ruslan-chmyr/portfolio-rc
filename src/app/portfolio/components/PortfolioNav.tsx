import { useEffect, useId, useRef, useState } from 'react'
import logoOnDarkBg from '../../../assets/rc-logo-white.svg'
import logoOnLightBg from '../../../assets/rc-logo-dark.svg'
import {
  EXPERIENCE_CV_PDF_URL,
  isExperienceCvPdfConfigured,
} from '../../../features/experience/model/experienceConfig'
import { chromeLogoSrc, useTheme } from '../../../shared/theme'
import { ThemeToggle } from '../../../shared/ui/ThemeToggle/ThemeToggle'
import { usePortfolioNavigation } from '../hooks/usePortfolioNavigation'
import { navigatePortfolioSection } from '../lib/navigatePortfolioSection'
import {
  findPortfolioSection,
  formatPortfolioSectionLabel,
  PORTFOLIO_NAV_SECTIONS,
  PORTFOLIO_RAIL_SECTIONS,
  type PortfolioSectionId,
} from '../lib/portfolioSections'
import type { PortfolioMarkerSectionId } from '../lib/portfolioSectionProgress'
import { PortfolioActiveSectionMarker } from './PortfolioActiveSectionMarker'
import '../styles/portfolio-chrome.css'

function railMarkerSectionId(
  activeSection: PortfolioSectionId,
): PortfolioMarkerSectionId {
  if (PORTFOLIO_RAIL_SECTIONS.has(activeSection) && activeSection !== 'intro') {
    return activeSection as PortfolioMarkerSectionId
  }
  return 'expertise'
}

function ResumeControl({
  configured,
  className,
}: {
  configured: boolean
  className?: string
}) {
  if (configured) {
    return (
      <a
        className={className}
        href={EXPERIENCE_CV_PDF_URL}
        target="_blank"
        rel="noreferrer"
      >
        Resume
      </a>
    )
  }
  return (
    <span className={className ? `${className} portfolio-nav__soon` : 'portfolio-nav__soon'} title="Resume coming soon">
      Resume
    </span>
  )
}

export function PortfolioNav() {
  const { theme } = useTheme()
  const { mode, activeSection, surface } = usePortfolioNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const logoSrc = chromeLogoSrc(theme, surface, {
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

  // Close menu when leaving compact mode without leaving stale open state.
  const [menuMode, setMenuMode] = useState(mode)
  if (menuMode !== mode) {
    setMenuMode(mode)
    if (mode !== 'compact' && menuOpen) setMenuOpen(false)
  }

  const menuVisible = mode === 'compact' && menuOpen
  const railActive = mode === 'rail'
  /** Rail sections on mobile: RC + Resume + Contact (no Menu), matching desktop rail. */
  const immersiveCompact =
    mode === 'compact' && PORTFOLIO_RAIL_SECTIONS.has(activeSection)
  const showCompactMenu = mode === 'compact' && !immersiveCompact
  const showInlineLinks = mode === 'standard' || immersiveCompact
  const showContactLink = activeSection !== 'contact'

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
      {/* Top bar: full horizontal chrome, or theme-only strip on Skills/Projects rail. */}
      <nav
        className={[
          'portfolio-nav',
          railActive ? 'portfolio-nav--theme-only' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="Primary"
      >
        {!railActive ? (
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
        ) : (
          <span className="portfolio-nav__brand-spacer" aria-hidden />
        )}

        {showCompactMenu && activeSection !== 'about' ? (
          <p className="portfolio-nav__section" aria-live="polite">
            {activeLabel}
          </p>
        ) : null}

        <div className="portfolio-nav__end">
          {showInlineLinks ? (
            <ul className="portfolio-nav__links">
              <li>
                <ResumeControl configured={resumeConfigured} />
              </li>
              {showContactLink ? (
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
              ) : null}
            </ul>
          ) : null}

          {showCompactMenu ? (
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
                    <ResumeControl configured={resumeConfigured} />
                  </li>
                </ul>
              ) : null}
            </div>
          ) : null}

          {/* Theme toggle stays top-right on rail sections; not in the rail. */}
          <ThemeToggle />
        </div>
      </nav>

      {railActive ? (
        <nav className="portfolio-nav-rail" aria-label="Section primary">
          <a
            className="portfolio-nav-rail__brand"
            href="#about-heading"
            onClick={(event) => {
              event.preventDefault()
              goTo('about')
            }}
          >
            <img
              className="portfolio-nav-rail__logo"
              src={logoSrc}
              width={36}
              height={36}
              alt="RC"
            />
          </a>

          <div className="portfolio-nav-rail__spine" aria-hidden />

          <ul className="portfolio-nav-rail__links">
            {showContactLink ? (
              <li>
                <a
                  className="portfolio-nav-rail__link"
                  href="#contact"
                  onClick={(event) => {
                    event.preventDefault()
                    goTo('contact')
                  }}
                >
                  Contact
                </a>
              </li>
            ) : null}
            <li>
              <ResumeControl
                configured={resumeConfigured}
                className="portfolio-nav-rail__link"
              />
            </li>
          </ul>

          <div className="portfolio-nav-rail__active">
            <PortfolioActiveSectionMarker
              sectionId={railMarkerSectionId(activeSection)}
              orientation="vertical"
            />
          </div>
        </nav>
      ) : null}
    </header>
  )
}
