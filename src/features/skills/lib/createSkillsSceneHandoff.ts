import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ABOUT_RETURN_PROGRESS } from '../../about/lib/aboutScrollConfig'
import {
  PORTFOLIO_SCROLL_HANDOFF_EVENT,
  PORTFOLIO_SCROLL_REENGAGE_EVENT,
} from '../../intro/lib/createIntroScrollHandoff'
import { isProjectsSceneActive } from '../../../shared/scene/portfolioScene'
import { THEME_CHANGE_EVENT } from '../../../shared/theme'
import { PORTFOLIO_NAVIGATE_EVENT } from '../../../app/portfolio/lib/navigatePortfolioSection'
import {
  isAboutReturnAligned,
  isSkillsAligned,
  isWithinHandoffCooldown,
  resolvePhaseAfterAlignInterrupt,
  shouldBeginAboutAlign,
  shouldBeginSkillsAlign,
  shouldCatchSkillsOvershoot,
  SKILLS_HANDOFF,
  type SkillsHandoffPhase,
} from './skillsSceneHandoffPolicy'

gsap.registerPlugin(ScrollTrigger)

function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - x, 3)
}

function readScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0
}

/** Single authoritative document scroll write — no multi-container scrollTop races. */
function writeScrollY(y: number) {
  const next = Math.max(0, y)
  window.scrollTo({ top: next, left: 0, behavior: 'auto' })
}

function findAboutSection(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.about-section')
}

function findAboutPin(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.about-section__pin')
}

function findAboutScrollTrigger(): ScrollTrigger | undefined {
  const about = findAboutSection()
  if (!about) return undefined
  return ScrollTrigger.getAll().find((trigger) => trigger.trigger === about)
}

/** Scroll Y where About scrub shows the settled (pre-exit) frame. */
function readAboutReturnScrollY(): number | null {
  const st = findAboutScrollTrigger()
  if (!st || !Number.isFinite(st.start) || !Number.isFinite(st.end)) return null
  return st.start + (st.end - st.start) * ABOUT_RETURN_PROGRESS
}

function readThemePortfolioBackground(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-portfolio-background')
    .trim()
  return value || '#ffffff'
}

export type SkillsSceneHandoff = {
  dispose: () => void
  getPhase: () => SkillsHandoffPhase
}

export type SkillsSceneHandoffOptions = {
  section: HTMLElement
  enabled: boolean
  onAligned?: () => void
  isBlocked?: () => boolean
}

function scrollDirection(delta: number): 1 | -1 | 0 {
  if (delta > 0.5) return 1
  if (delta < -0.5) return -1
  return 0
}

function isStoryInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      [
        '.skills-stories__stage',
        '.skills-stories__expand-overlay',
        '.skills-story-expanded',
        '.circular-carousel',
      ].join(','),
    ),
  )
}

/**
 * Bidirectional scene settle:
 * - Down → Skills top = viewport top
 * - Up (one gesture) → About settled scrub frame + fast theme background restore
 *
 * Scheduling is event-driven (coalesced rAF). A finite rAF loop runs only while
 * a programmatic align animation is in flight.
 */
export function createSkillsSceneHandoff(
  options: SkillsSceneHandoffOptions,
): SkillsSceneHandoff {
  const { section, enabled, onAligned, isBlocked } = options

  let disposed = false
  let phase: SkillsHandoffPhase = 'idle'
  let lastScrollY = typeof window !== 'undefined' ? readScrollY() : 0
  let lastDirection: 1 | -1 | 0 = 0
  let alignRaf = 0
  let pendingEvalRaf = 0
  let selfScrolling = false
  let cooldownUntilMs = 0
  let themeBgTween: gsap.core.Tween | null = null

  const setPhase = (next: SkillsHandoffPhase) => {
    phase = next
    section.dataset.skillsHandoff = next
  }
  setPhase('idle')

  const killThemeBgTween = () => {
    themeBgTween?.kill()
    themeBgTween = null
  }

  const killAlign = () => {
    if (alignRaf) cancelAnimationFrame(alignRaf)
    alignRaf = 0
    selfScrolling = false
  }

  const armCooldown = () => {
    cooldownUntilMs = performance.now() + SKILLS_HANDOFF.postAlignCooldownMs
  }

  const skillsTop = () => section.getBoundingClientRect().top

  const notifySkillsAligned = () => {
    onAligned?.()
  }

  const restoreThemeBackground = () => {
    const pin = findAboutPin()
    if (!pin) return
    killThemeBgTween()
    themeBgTween = gsap.to(pin, {
      backgroundColor: readThemePortfolioBackground(),
      duration: SKILLS_HANDOFF.themeBgDuration,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: () => {
        themeBgTween = null
      },
    })
  }

  const animateScrollTo = (
    endY: number,
    nextPhase: 'aligning-skills' | 'aligning-about',
    durationSec: number,
    onDone: () => void,
  ) => {
    killAlign()
    setPhase(nextPhase)
    const startY = readScrollY()
    const durationMs = durationSec * 1000
    const startedAt = performance.now()
    selfScrolling = true
    let framesWithoutMove = 0

    const step = (now: number) => {
      if (disposed || !selfScrolling) return
      const t = Math.min(1, (now - startedAt) / durationMs)
      const y = startY + (endY - startY) * easeOutCubic(t)
      writeScrollY(y)
      if (Math.abs(readScrollY() - y) > 2) {
        framesWithoutMove += 1
        if (framesWithoutMove >= 4) {
          alignRaf = 0
          writeScrollY(endY)
          selfScrolling = false
          onDone()
          return
        }
      } else {
        framesWithoutMove = 0
      }
      if (t >= 1) {
        alignRaf = 0
        selfScrolling = false
        onDone()
        return
      }
      alignRaf = requestAnimationFrame(step)
    }
    alignRaf = requestAnimationFrame(step)
  }

  const finishSkillsAligned = () => {
    if (disposed) return
    setPhase('settled')
    selfScrolling = false
    if (!isSkillsAligned(skillsTop())) {
      writeScrollY(readScrollY() + skillsTop())
    }
    lastScrollY = readScrollY()
    armCooldown()
    notifySkillsAligned()
  }

  const finishAboutAligned = () => {
    if (disposed) return
    setPhase('idle')
    selfScrolling = false
    const target = readAboutReturnScrollY()
    if (target != null && !isAboutReturnAligned(readScrollY(), target)) {
      writeScrollY(target)
    }
    lastScrollY = readScrollY()
    armCooldown()
    // Let scrub own the pin again once the theme surface is restored.
    const pin = findAboutPin()
    if (pin) {
      gsap.set(pin, { clearProps: 'backgroundColor' })
    }
  }

  const beginSkillsAlign = () => {
    if (disposed || !enabled) return
    if (phase === 'aligning-skills' || phase === 'aligning-about') return
    if (isBlocked?.()) return
    if (isWithinHandoffCooldown(performance.now(), cooldownUntilMs)) return

    const top = skillsTop()
    if (isSkillsAligned(top)) {
      setPhase('settled')
      notifySkillsAligned()
      return
    }

    const endY = Math.max(0, readScrollY() + top)
    animateScrollTo(
      endY,
      'aligning-skills',
      SKILLS_HANDOFF.forwardAlignDuration,
      finishSkillsAligned,
    )
  }

  const beginAboutAlign = () => {
    if (disposed || !enabled) return
    if (phase === 'aligning-skills' || phase === 'aligning-about') return
    if (isBlocked?.()) return
    if (isWithinHandoffCooldown(performance.now(), cooldownUntilMs)) return

    const target = readAboutReturnScrollY()
    if (target == null) return
    if (isAboutReturnAligned(readScrollY(), target)) {
      setPhase('idle')
      return
    }

    // Theme surface catches up immediately while we ease into the settled About frame.
    restoreThemeBackground()
    animateScrollTo(
      Math.max(0, target),
      'aligning-about',
      SKILLS_HANDOFF.reverseAlignDuration,
      finishAboutAligned,
    )
  }

  const isLaterSceneInView = (viewportHeight: number) => {
    // Experience underlaps Projects — while its top is still in/near the
    // viewport, reverse must stay on the scrubbed path (not snap to About).
    const experience = document.getElementById('experience')
    if (!experience) return false
    return (
      experience.getBoundingClientRect().top <
      viewportHeight * SKILLS_HANDOFF.laterSceneBlockTopFactor
    )
  }

  const evaluate = (direction: 1 | -1 | 0) => {
    if (disposed || !enabled || selfScrolling) return
    if (isWithinHandoffCooldown(performance.now(), cooldownUntilMs)) return

    const top = skillsTop()
    const blocked = isBlocked?.() === true
    const viewportHeight = window.innerHeight
    const currentScrollY = readScrollY()
    const projectsActive = isProjectsSceneActive()
    const laterSceneInView = isLaterSceneInView(viewportHeight)

    // Skills stays pinned at top≈0 under Projects / early Experience. Keep the
    // handoff in `passed` so reverse re-scrubs Projects→Skills instead of
    // jump-scrolling all the way to About on a tiny wheel tick.
    if (projectsActive || laterSceneInView) {
      if (phase !== 'passed') {
        killAlign()
        setPhase('passed')
      }
      return
    }

    const skillsInput = {
      enabled,
      reducedMotion: false,
      isMobile: false,
      phase,
      direction,
      skillsTop: top,
      viewportHeight,
      blocked,
    }

    if (shouldBeginSkillsAlign(skillsInput)) {
      beginSkillsAlign()
      return
    }

    if (shouldCatchSkillsOvershoot(skillsInput)) {
      setPhase('settled')
      killAlign()
      if (!isSkillsAligned(top)) {
        writeScrollY(currentScrollY + top)
      }
      lastScrollY = readScrollY()
      armCooldown()
      notifySkillsAligned()
      return
    }

    if (
      shouldBeginAboutAlign({
        enabled,
        reducedMotion: false,
        isMobile: false,
        phase,
        direction,
        skillsTop: top,
        viewportHeight,
        blocked,
        aboutReturnScrollY: readAboutReturnScrollY(),
        currentScrollY,
        laterSceneInView,
      })
    ) {
      beginAboutAlign()
      return
    }

    if (phase === 'settled') {
      if (top <= SKILLS_HANDOFF.passedTopPx && direction === 1) setPhase('passed')
      return
    }

    if (phase === 'passed') {
      // Returning from Projects / Experience: land on Skills before About.
      if (isSkillsAligned(top) && direction === -1) {
        setPhase('settled')
        cooldownUntilMs =
          performance.now() + SKILLS_HANDOFF.postProjectsSettleCooldownMs
        notifySkillsAligned()
      } else if (top > viewportHeight * 0.55) {
        setPhase('idle')
      }
    }
  }

  const scheduleEvaluation = (directionHint?: 1 | -1 | 0) => {
    if (disposed || !enabled) return
    if (directionHint != null && directionHint !== 0) {
      lastDirection = directionHint
    }
    if (pendingEvalRaf) return
    pendingEvalRaf = window.requestAnimationFrame(() => {
      pendingEvalRaf = 0
      if (disposed || !enabled || selfScrolling) return

      // Finish early if a prior align already landed (bounded, on-demand only).
      if (phase === 'aligning-skills' && isSkillsAligned(skillsTop())) {
        killAlign()
        finishSkillsAligned()
        return
      }
      const returnY = readAboutReturnScrollY()
      if (
        phase === 'aligning-about' &&
        returnY != null &&
        isAboutReturnAligned(readScrollY(), returnY)
      ) {
        killAlign()
        finishAboutAligned()
        return
      }

      evaluate(lastDirection)
    })
  }

  const interruptAlignFromUser = (
    wasAligning: 'aligning-skills' | 'aligning-about',
  ) => {
    killAlign()
    if (wasAligning === 'aligning-about') killThemeBgTween()
    setPhase(
      resolvePhaseAfterAlignInterrupt({
        wasAligning,
        skillsTop: skillsTop(),
        viewportHeight: window.innerHeight,
      }),
    )
    lastScrollY = readScrollY()
    armCooldown()
  }

  const onScroll = () => {
    if (disposed || !enabled) return
    const y = readScrollY()
    const direction = scrollDirection(y - lastScrollY)
    lastScrollY = y
    if (direction !== 0) lastDirection = direction
    // Programmatic writes must not be treated as user intent.
    if (selfScrolling) return
    scheduleEvaluation(direction)
  }

  const onWheel = (event: WheelEvent) => {
    if (disposed || !enabled) return
    if (isStoryInteractiveTarget(event.target)) return

    const direction = scrollDirection(event.deltaY)
    if (direction !== 0) lastDirection = direction

    // User input wins: cancel in-flight align and restore native scroll ownership.
    if (phase === 'aligning-skills' && event.deltaY < 0) {
      interruptAlignFromUser('aligning-skills')
      return
    }
    if (phase === 'aligning-about' && event.deltaY > 0) {
      interruptAlignFromUser('aligning-about')
      return
    }

    if (!selfScrolling) {
      scheduleEvaluation(direction)
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (disposed || !enabled) return
    const key = event.key
    if (
      key !== 'ArrowDown' &&
      key !== 'ArrowUp' &&
      key !== 'PageDown' &&
      key !== 'PageUp' &&
      key !== ' ' &&
      key !== 'Spacebar' &&
      key !== 'Home' &&
      key !== 'End'
    ) {
      return
    }

    let direction: 1 | -1 | 0 = 0
    if (key === 'ArrowDown' || key === 'PageDown' || key === ' ' || key === 'Spacebar' || key === 'End') {
      direction = 1
    } else if (key === 'ArrowUp' || key === 'PageUp' || key === 'Home') {
      direction = -1
    }

    if (phase === 'aligning-skills' && direction === -1) {
      interruptAlignFromUser('aligning-skills')
      return
    }
    if (phase === 'aligning-about' && direction === 1) {
      interruptAlignFromUser('aligning-about')
      return
    }

    scheduleEvaluation(direction)
  }

  const onResize = () => {
    scheduleEvaluation(lastDirection)
  }

  const onPageShow = () => {
    lastScrollY = readScrollY()
    scheduleEvaluation(0)
  }

  const resetFromIntro = () => {
    killAlign()
    killThemeBgTween()
    setPhase('idle')
    cooldownUntilMs = 0
    lastScrollY = readScrollY()
    scheduleEvaluation(0)
  }

  const syncIfAlreadyFramed = () => {
    if (!enabled || disposed) return
    if (isBlocked?.()) return
    if (isSkillsAligned(skillsTop(), SKILLS_HANDOFF.settleTolerancePx * 2)) {
      setPhase('settled')
      notifySkillsAligned()
    }
  }

  const onThemeChange = () => {
    if (disposed || !enabled) return
    // Retarget the About pin restore if a reverse align captured the prior theme color.
    if (phase === 'aligning-about' || themeBgTween) {
      restoreThemeBackground()
    }
  }

  const onPortfolioNavigate = (event: Event) => {
    if (disposed || !enabled) return
    const sectionId = (event as CustomEvent<{ sectionId?: string }>).detail
      ?.sectionId
    if (
      sectionId === 'projects' ||
      sectionId === 'experience' ||
      sectionId === 'contact'
    ) {
      killAlign()
      killThemeBgTween()
      setPhase('passed')
      return
    }
    if (sectionId === 'expertise') {
      killAlign()
      killThemeBgTween()
      setPhase('settled')
      return
    }
    if (sectionId === 'about') {
      killAlign()
      killThemeBgTween()
      setPhase('idle')
    }
  }

  if (enabled) {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, resetFromIntro)
    window.addEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, resetFromIntro)
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange)
    window.addEventListener(PORTFOLIO_NAVIGATE_EVENT, onPortfolioNavigate)
    // One-shot settle check after mount — not a perpetual loop.
    pendingEvalRaf = window.requestAnimationFrame(() => {
      pendingEvalRaf = 0
      syncIfAlreadyFramed()
    })
  }

  return {
    getPhase: () => phase,
    dispose: () => {
      if (disposed) return
      disposed = true
      killAlign()
      killThemeBgTween()
      if (pendingEvalRaf) cancelAnimationFrame(pendingEvalRaf)
      pendingEvalRaf = 0
      delete section.dataset.skillsHandoff
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, resetFromIntro)
      window.removeEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, resetFromIntro)
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange)
      window.removeEventListener(PORTFOLIO_NAVIGATE_EVENT, onPortfolioNavigate)
    },
  }
}
