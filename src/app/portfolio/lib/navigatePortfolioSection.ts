import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isProjectsSceneActive } from '../../../shared/scene/portfolioScene'
import {
  findPortfolioSection,
  type PortfolioSectionId,
} from './portfolioSections'

export const PORTFOLIO_NAVIGATE_EVENT = 'portfolio-navigate'

export type PortfolioNavigateDetail = {
  sectionId: Exclude<PortfolioSectionId, 'intro'>
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function writeScrollY(y: number, smooth: boolean) {
  window.scrollTo({
    top: Math.max(0, y),
    left: 0,
    behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
  })
}

function findScrollTriggerFor(el: Element | null): ScrollTrigger | undefined {
  if (!el) return undefined
  return ScrollTrigger.getAll().find((trigger) => trigger.trigger === el)
}

function markSkillsHandoffPassed() {
  const skills = document.getElementById('expertise')
  if (!skills) return
  skills.dataset.skillsHandoff = 'passed'
}

function announceNavigation(sectionId: Exclude<PortfolioSectionId, 'intro'>) {
  window.dispatchEvent(
    new CustomEvent<PortfolioNavigateDetail>(PORTFOLIO_NAVIGATE_EVENT, {
      detail: { sectionId },
    }),
  )
}

/**
 * Programmatic section navigation that respects intro capture and pin spacers.
 * Does not run while intro owns the viewport (Mode A has no section jumps).
 */
export function navigatePortfolioSection(
  sectionId: Exclude<PortfolioSectionId, 'intro'>,
): boolean {
  if (!document.documentElement.classList.contains('portfolio-native-scroll')) {
    return false
  }

  announceNavigation(sectionId)

  if (sectionId === 'about') {
    const about = document.querySelector('.about-section')
    const st = findScrollTriggerFor(about)
    writeScrollY(st ? st.start : 0, true)
    return true
  }

  if (sectionId === 'expertise') {
    const skills = document.getElementById('expertise')
    if (!skills) return false
    if (isProjectsSceneActive()) {
      // Leave projects pin ownership by scrolling to skills frame start.
      const projects = document.getElementById('projects')
      const st = findScrollTriggerFor(projects)
      if (st) writeScrollY(st.start - 1, false)
    }
    const top = skills.getBoundingClientRect().top + window.scrollY
    writeScrollY(top, true)
    return true
  }

  if (sectionId === 'projects') {
    markSkillsHandoffPassed()
    const projects = document.getElementById('projects')
    const st = findScrollTriggerFor(projects)
    if (st) {
      writeScrollY(st.start + 8, true)
      return true
    }
    if (!projects) return false
    writeScrollY(projects.getBoundingClientRect().top + window.scrollY, true)
    return true
  }

  const entry = findPortfolioSection(sectionId)
  if (!entry) return false
  markSkillsHandoffPassed()
  const el = document.getElementById(entry.targetId)
  if (!el) return false
  writeScrollY(el.getBoundingClientRect().top + window.scrollY, true)
  return true
}
