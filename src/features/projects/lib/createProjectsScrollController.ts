import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  PORTFOLIO_SCROLL_HANDOFF_EVENT,
  PORTFOLIO_SCROLL_REENGAGE_EVENT,
} from '../../intro/lib/createIntroScrollHandoff'
import {
  PROJECTS_SCROLL,
  SKILLS_ENTRANCE_DONE_EVENT,
  projectsExitStartsAt,
  projectsTotalPinDistancePx,
  resolveProjectsTriggerStart,
} from './projectsScrollConfig'

gsap.registerPlugin(ScrollTrigger)

/** Document marker so Skills handoff does not steal reverse scroll mid-Projects. */
export const PROJECTS_SCENE_DATASET_KEY = 'projectsScene'

export type ProjectsScrollControllerElements = {
  section: HTMLElement
  pin: HTMLElement
  panel: HTMLElement
}

export type ProjectsScrollController = {
  dispose: () => void
}

export function isProjectsSceneActive(root: ParentNode = document.documentElement): boolean {
  if (!(root instanceof HTMLElement)) return false
  return root.dataset[PROJECTS_SCENE_DATASET_KEY] === 'active'
}

/**
 * Pins Projects and scrubs the blue panel over Skills.
 * Skills is pinned in place (no extra spacer) so the wipe covers the same scene,
 * then fades out and restores on reverse.
 */
export function createProjectsScrollController(
  elements: ProjectsScrollControllerElements,
): ProjectsScrollController {
  const { section, pin, panel } = elements

  let disposed = false

  section.classList.remove('projects-section--static')
  section.dataset.projectsMotion = 'scroll'
  setProjectsSceneActive(section, false)

  const skills = document.getElementById('expertise')
  const experience = document.getElementById('experience')
  const skillsKeyboard = skills?.querySelector<HTMLElement>(
    '.skills-section__keyboard-panel',
  )
  const skillsHighlights = skills?.querySelector<HTMLElement>(
    '.skills-section__stories-panel',
  )
  const skillsFadeTargets = [skillsKeyboard, skillsHighlights].filter(
    (node): node is HTMLElement => Boolean(node),
  )

  const syncPinViewportHeight = () => {
    // Match the live layout viewport — CSS dvh can undershoot and leave a
    // dark strip of Skills painted under the pinned Projects scene.
    const height = Math.round(window.innerHeight)
    pin.style.height = `${height}px`
    pin.style.minHeight = `${height}px`
  }

  const ctx = gsap.context(() => {
    syncPinViewportHeight()
    gsap.set(panel, {
      xPercent: 100,
      force3D: true,
    })
    gsap.set(pin, {
      backgroundColor: 'transparent',
    })
    if (skillsFadeTargets.length > 0) {
      gsap.set(skillsFadeTargets, { autoAlpha: 1 })
    }

    // Hold Skills in the viewport without adding pin-spacing, so Projects
    // can slide over the same scene instead of revealing a blank page.
    if (skills) {
      ScrollTrigger.create({
        trigger: skills,
        start: 'top top',
        end: () => {
          const total = projectsTotalPinDistancePx(window.innerHeight)
          // Cover the Projects start offset + entrance/exit scrub + brief settle.
          return `+=${total + window.innerHeight * 0.25}`
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
          syncWillChange(panel, self.progress)
        },
        onToggle: (self) => {
          setProjectsSceneActive(section, self.isActive)
        },
        onUpdate: (self) => {
          setProjectsSceneActive(section, self.isActive)
          syncWillChange(panel, self.progress)
        },
      },
    })

    // 1) Blue panel wipes in over the pinned Skills scene.
    timeline.fromTo(
      panel,
      { xPercent: 100, yPercent: 0 },
      {
        xPercent: 0,
        yPercent: 0,
        duration: PROJECTS_SCROLL.panelSlideDuration,
        force3D: true,
        immediateRender: false,
      },
      0,
    )

    // 2) Highlights ease out with the leading edge of the wipe.
    if (skillsHighlights) {
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

    // 3) Keyboard / left Skills fade later — reverse restores both.
    if (skillsKeyboard) {
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

    // 5) Projects leaves left + up while Experience is already underneath.
    timeline.to(
      panel,
      {
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

    if (experience) {
      gsap.set(experience, { y: 0, force3D: true })
      timeline.fromTo(
        experience,
        {
          y: PROJECTS_SCROLL.experienceRevealY,
          force3D: true,
        },
        {
          y: 0,
          duration: PROJECTS_SCROLL.exitDuration,
          force3D: true,
          immediateRender: false,
        },
        exitAt,
      )
    }
  }, section)

  const refresh = () => {
    if (disposed) return
    syncPinViewportHeight()
    ScrollTrigger.refresh()
  }

  const onResize = () => refresh()
  const onEntranceDone = () => refresh()
  window.addEventListener('resize', onResize)
  window.addEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, refresh)
  window.addEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, refresh)
  window.addEventListener(SKILLS_ENTRANCE_DONE_EVENT, onEntranceDone)

  const refreshRaf = window.requestAnimationFrame(refresh)

  return {
    dispose: () => {
      if (disposed) return
      disposed = true
      window.cancelAnimationFrame(refreshRaf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(PORTFOLIO_SCROLL_HANDOFF_EVENT, refresh)
      window.removeEventListener(PORTFOLIO_SCROLL_REENGAGE_EVENT, refresh)
      window.removeEventListener(SKILLS_ENTRANCE_DONE_EVENT, onEntranceDone)
      panel.style.willChange = ''
      pin.style.height = ''
      pin.style.minHeight = ''
      if (skillsFadeTargets.length > 0) {
        gsap.set(skillsFadeTargets, { clearProps: 'opacity,visibility' })
      }
      if (experience) {
        gsap.set(experience, { clearProps: 'transform' })
      }
      setProjectsSceneActive(section, false)
      ctx.revert()
      delete section.dataset.projectsMotion
      ScrollTrigger.refresh()
    },
  }
}

function setProjectsSceneActive(section: HTMLElement, active: boolean) {
  if (active) {
    document.documentElement.dataset[PROJECTS_SCENE_DATASET_KEY] = 'active'
    section.dataset.projectsActive = 'true'
  } else {
    delete document.documentElement.dataset[PROJECTS_SCENE_DATASET_KEY]
    delete section.dataset.projectsActive
  }
}

function syncWillChange(panel: HTMLElement, progress: number) {
  const active = progress > 0.001 && progress < 0.999
  panel.style.willChange = active ? 'transform' : ''
}
