import gsap from 'gsap'
import { SKILLS_ENTRANCE } from './skillsEntranceConfig'
import { decideSkillsEntrance } from './skillsSceneHandoffPolicy'

export type SkillsEntranceTargets = {
  section: HTMLElement
  chrome: HTMLElement[]
  keyboard: HTMLElement | null
  stories: HTMLElement | null
}

export type SkillsEntranceController = {
  playFromAlignment: () => void
  showInstant: () => void
  dispose: () => void
  hasPlayed: () => boolean
}

function clearWillChange(nodes: Array<HTMLElement | null | undefined>) {
  for (const node of nodes) {
    if (!node) continue
    node.style.willChange = ''
  }
}

/**
 * One-shot Skills scene reveal. Does not remount the canvas or carousel —
 * only fades/translates outer presentation shells.
 */
export function createSkillsEntranceController(
  targets: SkillsEntranceTargets,
  options: { reducedMotion: boolean; isMobile: boolean },
): SkillsEntranceController {
  const { section, chrome, keyboard, stories } = targets
  const nodes = [...chrome, keyboard, stories]

  let disposed = false
  let played = false
  let timeline: gsap.core.Timeline | null = null

  const setEntranceState = (state: 'pending' | 'playing' | 'done') => {
    section.dataset.skillsEntrance = state
  }

  const showInstant = () => {
    if (disposed) return
    timeline?.kill()
    timeline = null
    gsap.set(nodes.filter(Boolean), { clearProps: 'opacity,transform,visibility' })
    clearWillChange(nodes)
    played = true
    setEntranceState('done')
  }

  const seedPending = () => {
    const decision = decideSkillsEntrance({
      hasPlayed: false,
      reducedMotion: options.reducedMotion,
      isMobile: options.isMobile,
      sceneAligned: false,
    })
    if (decision.kind === 'instant') {
      showInstant()
      return
    }
    setEntranceState('pending')
    gsap.set(chrome, { autoAlpha: 0, y: SKILLS_ENTRANCE.chrome.y })
    if (keyboard) gsap.set(keyboard, { autoAlpha: 0, y: SKILLS_ENTRANCE.keyboard.y })
    if (stories) {
      gsap.set(stories, {
        autoAlpha: 0,
        y: SKILLS_ENTRANCE.stories.y,
        x: SKILLS_ENTRANCE.stories.x,
      })
    }
  }

  seedPending()

  const playFromAlignment = () => {
    if (disposed) return
    const decision = decideSkillsEntrance({
      hasPlayed: played,
      reducedMotion: options.reducedMotion,
      isMobile: options.isMobile,
      sceneAligned: true,
    })
    if (decision.kind === 'skip') return
    if (decision.kind === 'instant') {
      showInstant()
      return
    }

    played = true
    setEntranceState('playing')
    timeline?.kill()

    for (const node of nodes) {
      if (node) node.style.willChange = 'opacity, transform'
    }

    timeline = gsap.timeline({
      defaults: { ease: SKILLS_ENTRANCE.ease },
      onComplete: () => {
        if (disposed) return
        clearWillChange(nodes)
        gsap.set(nodes.filter(Boolean), { clearProps: 'transform' })
        setEntranceState('done')
        timeline = null
      },
    })

    if (chrome.length) {
      timeline.to(
        chrome,
        {
          autoAlpha: 1,
          y: 0,
          duration: SKILLS_ENTRANCE.chrome.duration,
          stagger: SKILLS_ENTRANCE.chrome.stagger,
        },
        SKILLS_ENTRANCE.chrome.at,
      )
    }

    if (keyboard) {
      timeline.to(
        keyboard,
        {
          autoAlpha: 1,
          y: 0,
          duration: SKILLS_ENTRANCE.keyboard.duration,
        },
        SKILLS_ENTRANCE.keyboard.at,
      )
    }

    if (stories) {
      timeline.to(
        stories,
        {
          autoAlpha: 1,
          y: 0,
          x: 0,
          duration: SKILLS_ENTRANCE.stories.duration,
        },
        SKILLS_ENTRANCE.stories.at,
      )
    }
  }

  return {
    playFromAlignment,
    showInstant,
    hasPlayed: () => played,
    dispose: () => {
      if (disposed) return
      disposed = true
      timeline?.kill()
      timeline = null
      clearWillChange(nodes)
      gsap.set(nodes.filter(Boolean), { clearProps: 'opacity,transform,visibility' })
      setEntranceState('done')
    },
  }
}
