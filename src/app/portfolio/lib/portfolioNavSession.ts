/**
 * Single-owner flag for programmatic portfolio navigation.
 * Skills handoff must not start automatic aligns while this session is active.
 * User wheel/touch/keyboard clears ownership so native interruption wins.
 */

export const PORTFOLIO_NAV_DATASET_KEY = 'portfolioNav'

export type PortfolioNavSession = {
  sectionId: string
  targetY: number
}

type ActiveSession = PortfolioNavSession & {
  raf: number
  lastY: number
  stableFrames: number
  dispose: () => void
}

let active: ActiveSession | null = null

function readScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0
}

export function isPortfolioNavSessionActive(): boolean {
  return active != null
}

export function getPortfolioNavSession(): PortfolioNavSession | null {
  if (!active) return null
  return { sectionId: active.sectionId, targetY: active.targetY }
}

export function endPortfolioNavSession(): void {
  if (!active) return
  const session = active
  active = null
  session.dispose()
}

function isScrollInterruptKey(key: string, shiftKey: boolean): boolean {
  return (
    key === 'ArrowDown' ||
    key === 'ArrowUp' ||
    key === 'PageDown' ||
    key === 'PageUp' ||
    key === 'Home' ||
    key === 'End' ||
    key === ' ' ||
    key === 'Spacebar' ||
    (key === ' ' && shiftKey)
  )
}

/**
 * Begin exclusive programmatic navigation ownership until settle or interrupt.
 */
export function beginPortfolioNavSession(
  sectionId: string,
  targetY: number,
): void {
  endPortfolioNavSession()

  const root = document.documentElement
  root.dataset[PORTFOLIO_NAV_DATASET_KEY] = sectionId

  const onWheel = () => endPortfolioNavSession()
  const onTouchStart = () => endPortfolioNavSession()
  const onKeyDown = (event: KeyboardEvent) => {
    if (isScrollInterruptKey(event.key, event.shiftKey)) {
      endPortfolioNavSession()
    }
  }
  const onScrollEnd = () => endPortfolioNavSession()

  window.addEventListener('wheel', onWheel, { passive: true, capture: true })
  window.addEventListener('touchstart', onTouchStart, {
    passive: true,
    capture: true,
  })
  window.addEventListener('keydown', onKeyDown, { capture: true })
  window.addEventListener('scrollend', onScrollEnd)

  const session: ActiveSession = {
    sectionId,
    targetY,
    raf: 0,
    lastY: readScrollY(),
    stableFrames: 0,
    dispose: () => {
      if (session.raf) cancelAnimationFrame(session.raf)
      session.raf = 0
      delete root.dataset[PORTFOLIO_NAV_DATASET_KEY]
      window.removeEventListener('wheel', onWheel, true)
      window.removeEventListener('touchstart', onTouchStart, true)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('scrollend', onScrollEnd)
    },
  }
  active = session

  const tick = () => {
    if (active !== session) return
    const y = readScrollY()
    const nearTarget = Math.abs(y - session.targetY) <= 8
    const stopped = Math.abs(y - session.lastY) < 0.5

    if (nearTarget) {
      endPortfolioNavSession()
      return
    }

    if (stopped) {
      session.stableFrames += 1
      // Smooth scroll finished away from exact target (layout/pin skew) — release.
      if (session.stableFrames >= 10) {
        endPortfolioNavSession()
        return
      }
    } else {
      session.stableFrames = 0
    }

    session.lastY = y
    session.raf = requestAnimationFrame(tick)
  }
  session.raf = requestAnimationFrame(tick)
}
