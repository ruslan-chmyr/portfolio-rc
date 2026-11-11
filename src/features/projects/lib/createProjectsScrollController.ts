import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  PORTFOLIO_SCROLL_HANDOFF_EVENT,
  PORTFOLIO_SCROLL_REENGAGE_EVENT,
} from '../../intro/lib/createIntroScrollHandoff'
import {
  SKILLS_ENTRANCE_DONE_EVENT,
  cancelScheduledScrollTriggerRefresh,
  isSkillsEntranceDone,
  scheduleScrollTriggerRefresh,
  setProjectsSceneActive,
} from '../../../shared/scene/portfolioScene'
import {
  PROJECTS_SCROLL,
  projectsExitStartsAt,
  projectsTotalPinDistancePx,
  resolveProjectsTriggerStart,
} from './projectsScrollConfig'

gsap.registerPlugin(ScrollTrigger)

/** @deprecated Prefer shared/scene/portfolioScene — kept for existing imports. */
export {
  PROJECTS_SCENE_DATASET_KEY,
  isProjectsSceneActive,
} from '../../../shared/scene/portfolioScene'

export type ProjectsScrollControllerElements = {
  section: HTMLElement
  pin: HTMLElement
  panel: HTMLElement
}

export type ProjectsScrollController = {
  dispose: () => void
}

/**
 * Pins Projects and scrubs the blue panel over Skills, then exits left/up
 * into Experience. Skills is pinned without spacer so the wipe shares one scene.
 *
 * Ownership:
 * - Skills entrance owns initial opacity/visibility of Skills chrome.
 * - This controller only fades Skills after entrance is done (scrubbed fromTo,
 *   never forced visible on init).
 * - Experience motion lives on an inner wrapper, not the section layout box.
 */
export function createProjectsScrollController(
  elements: ProjectsScrollControllerElements,
): ProjectsScrollController {
  const { section, pin, panel } = elements

  let disposed = false
  /** True once we have applied scrubbed fades to Skills (entrance already done). */
  let ownedSkillsFade = false

  section.classList.remove('projects-section--static')
  section.dataset.projectsMotion = 'scroll'
  setProjectsSceneActive(section, false)

  const skills = document.getElementById('expertise')
  const experienceMotion = document.querySelector<HTMLElement>(
    '#experience .experience-section__motion',
  )
  const skillsKeyboard = skills?.querySelector<HTMLElement>(
    '.skills-section__keyboard-panel',
  )
  const skillsHighlights = skills?.querySelector<HTMLElement>(
    '.skills-section__stories-panel',
  )
  const skillsFadeTargets = [skillsKeyboard, skillsHighlights].filter(
    (node): node is HTMLElement => Boolean(node),
  )

  const refreshState = { raf: 0, pending: false }

  const syncPinViewportHeight = () => {
    // Match the live layout viewport — CSS dvh can undershoot and leave a
    // dark strip of Skills painted under the pinned Projects scene.
    const height = Math.round(window.innerHeight)
    pin.style.height = `${height}px`
    pin.style.minHeight = `${height}px`
  }

  const syncSkillsViewportClip = (active: boolean) => {
    if (!skills) return
    if (active) {
      // Tall Skills content must not paint past the pinned Projects viewport.
      skills.style.maxHeight = `${Math.round(window.innerHeight)}px`
      skills.style.overflow = 'hidden'
    } else {
      skills.style.maxHeight = ''
      skills.style.overflow = ''
    }
  }

  const ctx = gsap.context(() => {
    syncPinViewportHeight()
    // Lock pixel x/y to 0 — ScrollTrigger invalidateOnRefresh can otherwise
    // bake the live matrix into `x` while xPercent keeps tweening (double offset).
    gsap.set(panel, {
      x: 0,
      y: 0,
      xPercent: 100,
      yPercent: 0,
      force3D: true,
    })
    gsap.set(pin, {
      backgroundColor: 'transparent',
      autoAlpha: 1,
    })
    if (experienceMotion) {
      // Use marginTop — not transform. A transform on this wrapper breaks
      // position:sticky for the Experience intro sidebar.
      gsap.set(experienceMotion, { marginTop: 0 })
    }

    // Skills pin: hold the scene under Projects without adding document spacing.
    // End covers Projects trigger offset (top+=12vh) + full entrance/exit scrub.
    if (skills) {
      ScrollTrigger.create({
        trigger: skills,
        start: 'top top',
        end: () => {
          const total = projectsTotalPinDistancePx(window.innerHeight)
          const triggerPad = window.innerHeight * 0.12
          return `+=${total + triggerPad}`
        },
        pin: true,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      })
    }

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: () => resolveProjectsTriggerStart(skills),
        end: () => `+=${projectsTotalPinDistancePx(window.innerHeight)}`,
        pin,
        scrub: PROJECTS_SCROLL.scrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          syncPinViewportHeight()
          setProjectsSceneActive(section, self.isActive)
          syncSkillsViewportClip(self.isActive)
          syncWillChange(panel, experienceMotion, self.progress)
        },
        onToggle: (self) => {
          setProjectsSceneActive(section, self.isActive)
          syncSkillsViewportClip(self.isActive)
        },
        onUpdate: (self) => {
          setProjectsSceneActive(section, self.isActive)
          syncSkillsViewportClip(self.isActive)
          syncWillChange(panel, experienceMotion, self.progress)
        },
      },
    })

    // 1) Blue panel wipes in over the pinned Skills scene.
    timeline.fromTo(
      panel,
      { x: 0, y: 0, xPercent: 100, yPercent: 0 },
      {
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0,
        duration: PROJECTS_SCROLL.panelSlideDuration,
        force3D: true,
        immediateRender: false,
      },
      0,
    )

    // 2–3) Skills fades — only after entrance owns reveal (gated by trigger start).
    // Never gsap.set(... autoAlpha: 1) here; that races the entrance controller.
    if (skillsHighlights) {
      ownedSkillsFade = true
      timeline.fromTo(
        skillsHighlights,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          duration: PROJECTS_SCROLL.highlightsFadeDuration,
          immediateRender: false,
        },
        PROJECTS_SCROLL.highlightsFadeAt,
      )
    }

    if (skillsKeyboard) {
      ownedSkillsFade = true
      timeline.fromTo(
        skillsKeyboard,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          duration: PROJECTS_SCROLL.skillsFadeDuration,
          immediateRender: false,
        },
        PROJECTS_SCROLL.skillsFadeAt,
      )
    }

    // 4) Navy pin backdrop arrives later so early gutters still show Skills.
    timeline.fromTo(
      pin,
      { backgroundColor: 'transparent', autoAlpha: 1 },
      {
        backgroundColor: PROJECTS_SCROLL.sceneBackdrop,
        autoAlpha: 1,
        duration: PROJECTS_SCROLL.pinBackdropDuration,
        immediateRender: false,
      },
      PROJECTS_SCROLL.pinBackdropAt,
    )

    const exitAt = projectsExitStartsAt()

    timeline.to(
      {},
      { duration: PROJECTS_SCROLL.settleHoldDuration },
      exitAt - PROJECTS_SCROLL.settleHoldDuration,
    )

    // 5) Projects leaves left + up; pin fades to uncover underlapped Experience.
    timeline.to(
      panel,
      {
        x: 0,
        y: 0,
        xPercent: PROJECTS_SCROLL.exitXPercent,
        yPercent: PROJECTS_SCROLL.exitYPercent,
        duration: PROJECTS_SCROLL.exitDuration,
        force3D: true,
        immediateRender: false,
      },
      exitAt,
    )

    timeline.to(
      pin,
      {
        autoAlpha: 0,
        duration: PROJECTS_SCROLL.exitFadeDuration,
        immediateRender: false,
      },
      exitAt + PROJECTS_SCROLL.exitFadeAt,
    )

    // Soft rise for Experience — marginTop keeps sticky intro working.
    if (experienceMotion) {
      timeline.fromTo(
        experienceMotion,
        {
          marginTop: PROJECTS_SCROLL.experienceRevealY,
        },
        {
          marginTop: 0,
          duration: PROJECTS_SCROLL.exitDuration,
          immediateRender: false,
        },
        exitAt,
      )
    }
  }, section)

  const runRefresh = () => {
    if (disposed) return
    syncPinViewportHeight()
    ScrollTrigger.refresh()
  }

  const requestRefresh = () => {
    if (disposed) return
    scheduleScrollTriggerRefresh(runRefresh, refreshState)
  }

  window.addEventListener('resize', requestRefresh)
  window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, requestRefresh)
  window.addEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, requestRefresh)
  window.addEventListener(SKILLS_ENTRANCE_DONE_EVENT, requestRefresh)

  requestRefresh()

  return {
    dispose: () => {
      if (disposed) return
      disposed = true
      cancelScheduledScrollTriggerRefresh(refreshState)
      window.removeEventListener('resize', requestRefresh)
      window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, requestRefresh)
      window.removeEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, requestRefresh)
      window.removeEventListener(SKILLS_ENTRANCE_DONE_EVENT, requestRefresh)
      panel.style.willChange = ''
      if (experienceMotion) experienceMotion.style.willChange = ''
      pin.style.height = ''
      pin.style.minHeight = ''
      syncSkillsViewportClip(false)

      // Only clear Skills fade props when we owned them and entrance is settled —
      // never wipe a pending Skills entrance.
      if (
        ownedSkillsFade &&
        isSkillsEntranceDone(skills) &&
        skillsFadeTargets.length > 0
      ) {
        gsap.set(skillsFadeTargets, { clearProps: 'opacity,visibility' })
      }
      if (experienceMotion) {
        gsap.set(experienceMotion, { clearProps: 'marginTop' })
      }

      setProjectsSceneActive(section, false)
      ctx.revert()
      delete section.dataset.projectsMotion
      ScrollTrigger.refresh()
    },
  }
}

function syncWillChange(
  panel: HTMLElement,
  experienceMotion: HTMLElement | null,
  progress: number,
) {
  const active = progress > 0.001 && progress < 0.999
  panel.style.willChange = active ? 'transform' : ''
  if (experienceMotion) {
    experienceMotion.style.willChange = active ? 'margin-top' : ''
  }
}
