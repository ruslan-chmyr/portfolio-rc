import { useEffect, useState } from 'react'
import {
  PORTFOLIO_SCROLL_HANDOFF_EVENT,
  PORTFOLIO_SCROLL_REENGAGE_EVENT,
} from '../../../features/intro/lib/createIntroScrollHandoff'
import { detectActivePortfolioSection } from '../lib/detectActivePortfolioSection'
import {
  portfolioChromeSurface,
  resolvePortfolioNavMode,
} from '../lib/resolvePortfolioNavMode'
import type {
  PortfolioNavMode,
  PortfolioSectionId,
} from '../lib/portfolioSections'

const ROOT_NATIVE_SCROLL = 'portfolio-native-scroll'

function readNativeScroll() {
  return document.documentElement.classList.contains(ROOT_NATIVE_SCROLL)
}

export type PortfolioNavigationState = {
  mode: PortfolioNavMode
  activeSection: PortfolioSectionId
  surface: 'intro' | 'portfolio' | 'immersive'
}

export function usePortfolioNavigation(): PortfolioNavigationState {
  const [state, setState] = useState<PortfolioNavigationState>(() => {
    const activeSection = detectActivePortfolioSection()
    const nativeScroll =
      typeof document !== 'undefined' ? readNativeScroll() : false
    const viewportWidth =
      typeof window !== 'undefined' ? window.innerWidth : 1280
    return {
      activeSection,
      mode: resolvePortfolioNavMode({
        nativeScroll,
        activeSection,
        viewportWidth,
      }),
      surface: portfolioChromeSurface(activeSection),
    }
  })

  useEffect(() => {
    let raf = 0
    let disposed = false

    const publish = () => {
      if (disposed) return
      const activeSection = detectActivePortfolioSection()
      const nativeScroll = readNativeScroll()
      const viewportWidth = window.innerWidth
      const mode = resolvePortfolioNavMode({
        nativeScroll,
        activeSection,
        viewportWidth,
      })
      const surface = portfolioChromeSurface(activeSection)
      setState((prev) => {
        if (
          prev.activeSection === activeSection &&
          prev.mode === mode &&
          prev.surface === surface
        ) {
          return prev
        }
        return { activeSection, mode, surface }
      })
    }

    const schedule = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        publish()
      })
    }

    publish()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, schedule)
    window.addEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, schedule)

    const observer = new MutationObserver(schedule)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-projects-scene'],
    })
    const skills = document.getElementById('expertise')
    if (skills) {
      observer.observe(skills, {
        attributes: true,
        attributeFilter: ['data-skills-handoff'],
      })
    }

    return () => {
      disposed = true
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, schedule)
      window.removeEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, schedule)
      observer.disconnect()
    }
  }, [])

  return state
}
