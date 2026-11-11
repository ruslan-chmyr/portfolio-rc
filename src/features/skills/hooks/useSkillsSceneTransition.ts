import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { isStoryFocusBusy, type StoryFocusPhase } from '../lib/storyFocusTransition'
import { createSkillsEntranceController } from '../lib/createSkillsEntranceController'
import { createSkillsSceneHandoff } from '../lib/createSkillsSceneHandoff'
import { SKILLS_HANDOFF } from '../lib/skillsSceneHandoffPolicy'
import { prefersReducedMotion } from '../lib/webglSupport'

export type SkillsSceneTransitionTargets = {
  sectionRef: RefObject<HTMLElement | null>
  inspectionRef: RefObject<HTMLElement | null>
  footerRef: RefObject<HTMLElement | null>
  stageRef: RefObject<HTMLElement | null>
  storiesRef: RefObject<HTMLElement | null>
}

/**
 * Desktop About → Skills fullscreen align + one-shot entrance.
 * Mobile / reduced-motion skip align and show content immediately.
 */
export function useSkillsSceneTransition(
  targets: SkillsSceneTransitionTargets,
  storyPhase: StoryFocusPhase,
) {
  const storyPhaseRef = useRef(storyPhase)

  useEffect(() => {
    storyPhaseRef.current = storyPhase
  }, [storyPhase])

  useLayoutEffect(() => {
    const section = targets.sectionRef.current
    if (!section) return

    const mobileMq = window.matchMedia(
      `(max-width: ${SKILLS_HANDOFF.mobileMaxWidthPx}px)`,
    )
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    let handoff: ReturnType<typeof createSkillsSceneHandoff> | undefined
    let entrance: ReturnType<typeof createSkillsEntranceController> | undefined
    const entranceRef: {
      current: ReturnType<typeof createSkillsEntranceController> | undefined
    } = { current: undefined }

    const setup = () => {
      handoff?.dispose()
      entrance?.dispose()
      handoff = undefined
      entrance = undefined
      entranceRef.current = undefined

      const isMobile = mobileMq.matches
      const reduced = prefersReducedMotion() || motionMq.matches
      const chrome = [targets.inspectionRef.current, targets.footerRef.current].filter(
        (node): node is HTMLElement => Boolean(node),
      )

      entrance = createSkillsEntranceController(
        {
          section,
          chrome,
          keyboard: targets.stageRef.current,
          stories: targets.storiesRef.current,
        },
        { reducedMotion: reduced, isMobile },
      )
      entranceRef.current = entrance

      const enabled = !isMobile && !reduced
      if (!enabled) {
        entrance.showInstant()
        return
      }

      handoff = createSkillsSceneHandoff({
        section,
        enabled: true,
        isBlocked: () =>
          isStoryFocusBusy(storyPhaseRef.current) ||
          section.getAttribute('data-skills-mode') === 'story-focus',
        onAligned: () => {
          entranceRef.current?.playFromAlignment()
        },
      })
    }

    setup()
    mobileMq.addEventListener('change', setup)
    motionMq.addEventListener('change', setup)

    return () => {
      mobileMq.removeEventListener('change', setup)
      motionMq.removeEventListener('change', setup)
      handoff?.dispose()
      entrance?.dispose()
    }
  }, [targets])
}
