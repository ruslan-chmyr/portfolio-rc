import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isProjectsSceneActive } from '../../../shared/scene/portfolioScene'
import {
  beginPortfolioNavSession,
  endPortfolioNavSession,
} from './portfolioNavSession'
import {
  findPortfolioSection,
  type PortfolioSectionId,
} from './portfolioSections'

export const PORTFOLIO_NAVIGATE_EVENT = 'portfolio-navigate'

export type PortfolioNavigateDetail = {
  sectionId: Exclude<PortfolioSectionId, 'intro'>
}

export type NavigableSectionId = Exclude<PortfolioSectionId, 'intro'>

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function readScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0
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

function announceNavigation(sectionId: NavigableSectionId) {
  window.dispatchEvent(
    new CustomEvent<PortfolioNavigateDetail>(PORTFOLIO_NAVIGATE_EVENT, {
      detail: { sectionId },
    }),
  )
}

function resolveTargetY(sectionId: NavigableSectionId): number | null {
  if (sectionId === 'about') {
    const about = document.querySelector('.about-section')
    if (!about && !document.getElementById('about-heading')) return null
    const st = findScrollTriggerFor(about)
    return st ? st.start : 0
  }

  if (sectionId === 'expertise') {
    const skills = document.getElementById('expertise')
    if (!skills) return null
    if (isProjectsSceneActive()) {
      const projects = document.getElementById('projects')
      const st = findScrollTriggerFor(projects)
      if (st) {
        // Leave the Projects pin before measuring Skills.
        writeScrollY(Math.max(0, st.start - 1), false)
      }
    }
    return Math.max(0, skills.getBoundingClientRect().top + readScrollY())
  }

  if (sectionId === 'projects') {
    const projects = document.getElementById('projects')
    if (!projects) return null
    const st = findScrollTriggerFor(projects)
    if (st) return st.start + 8
    return Math.max(0, projects.getBoundingClientRect().top + readScrollY())
  }

  const entry = findPortfolioSection(sectionId)
  if (!entry) return null
  const el = document.getElementById(entry.targetId)
  if (!el) return null
  return Math.max(0, el.getBoundingClientRect().top + readScrollY())
}

/**
 * Programmatic section navigation that respects intro capture and pin spacers.
 * Validates the destination before announcing or mutating Skills handoff state.
 * Owns scroll until settle or user interrupt so Skills handoff cannot compete.
 */
export function navigatePortfolioSection(
  sectionId: NavigableSectionId,
): boolean {
  if (!document.documentElement.classList.contains('portfolio-native-scroll')) {
    return false
  }

  const targetY = resolveTargetY(sectionId)
  if (targetY == null || !Number.isFinite(targetY)) {
    return false
  }

  beginPortfolioNavSession(sectionId, targetY)
  // Announce only after validation — handoff updates phase / kills aligns.
  announceNavigation(sectionId)
  writeScrollY(targetY, true)

  // If write was a no-op (already there), release ownership immediately.
  if (Math.abs(readScrollY() - targetY) <= 8) {
    endPortfolioNavSession()
  }

  return true
}
