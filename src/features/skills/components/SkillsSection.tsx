import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKeyboardSound } from '../hooks/useKeyboardSound'
import { useSkillCategoryTransition } from '../hooks/useSkillCategoryTransition'
import { useSkillsSceneTransition } from '../hooks/useSkillsSceneTransition'
import {
  shouldPlayEngageSound,
  type SkillEngageOptions,
} from '../lib/skillEngagement'
import { resolveSkillInspection } from '../lib/skillSelection'
import { toRelatedSkillSet } from '../lib/storyHighlight'
import type { StoryFocusPhase } from '../lib/storyFocusTransition'
import { isStoryFocusActive } from '../lib/storyFocusTransition'
import { canUseWebGL, prefersReducedMotion } from '../lib/webglSupport'
import {
  getSkill,
  type SkillBoardCategory,
  type SkillId,
} from '../model/skillsConfig'
import {
  getEngineeringStory,
  type EngineeringStoryId,
} from '../model/storiesConfig'
import { SkillCategorySelector } from './SkillCategorySelector'
import { SkillInspection } from './SkillInspection'
import { SkillSoundToggle } from './SkillSoundToggle'
import { SkillsKeyboardFallback } from './SkillsKeyboardFallback'
import { StoriesPanel } from './stories/StoriesPanel'
import '../styles/skills.css'

const SkillsKeyboardCanvas = lazy(() =>
  import('./SkillsKeyboardCanvas').then((module) => ({
    default: module.SkillsKeyboardCanvas,
  })),
)

export function SkillsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const inspectionRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const storiesRef = useRef<HTMLElement>(null)
  const sceneTargets = useMemo(
    () => ({
      sectionRef,
      inspectionRef,
      footerRef,
      stageRef,
      storiesRef,
    }),
    [],
  )

  const [webgl] = useState(() => canUseWebGL())
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion())
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId | null>(null)
  const [focusedStoryId, setFocusedStoryId] = useState<EngineeringStoryId | null>(
    null,
  )
  const [storyPhase, setStoryPhase] = useState<StoryFocusPhase>('explore')
  const { soundEnabled, toggleSound, playKeyClick } = useKeyboardSound()
  const {
    activeCategory,
    displayCategory,
    isFlipping,
    flipNonce,
    selectCategory,
    handleFlipSwap,
    handleFlipComplete,
  } = useSkillCategoryTransition()

  const focusedStory = getEngineeringStory(focusedStoryId)
  const relatedSkillIds = useMemo(
    () => toRelatedSkillSet(focusedStory?.relatedSkillIds),
    [focusedStory],
  )
  const storyFocusActive = isStoryFocusActive(storyPhase)

  useSkillsSceneTransition(sceneTargets, storyPhase)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const handleSelectCategory = useCallback(
    (category: SkillBoardCategory) => {
      setSelectedSkillId(null)
      selectCategory(category)
    },
    [selectCategory],
  )

  const handleEngageSkill = useCallback(
    (skillId: SkillId, options?: SkillEngageOptions) => {
      if (isFlipping) return
      // Story Focus: only related skills stay pressable.
      if (relatedSkillIds && !relatedSkillIds.has(skillId)) return
      setSelectedSkillId((current) => {
        const next = resolveSkillInspection(current, skillId)
        return current === next ? current : next
      })
      if (shouldPlayEngageSound(options) && soundEnabled) playKeyClick()
    },
    [isFlipping, playKeyClick, relatedSkillIds, soundEnabled],
  )

  const handleClearInspection = useCallback(() => {
    if (isFlipping) return
    setSelectedSkillId(null)
  }, [isFlipping])

  const handleOpenStory = useCallback(
    (storyId: EngineeringStoryId) => {
      const story = getEngineeringStory(storyId)
      if (!story) return
      setFocusedStoryId(story.id)
      setSelectedSkillId((current) => {
        if (!current) return current
        return story.relatedSkillIds.includes(current) ? current : null
      })
      // Always spin once on open — even when the board category stays the same.
      selectCategory(story.category, { forceFlip: true })
    },
    [selectCategory],
  )

  const handleCloseStoryStart = useCallback(() => {
    // Always spin once on close, in parallel with the column expand.
    selectCategory(activeCategory, { forceFlip: true })
  }, [activeCategory, selectCategory])

  const handleCloseStory = useCallback(() => {
    setFocusedStoryId(null)
  }, [])

  // Story Focus hides inspection for keys that are no longer interactive.
  const inspectedSkillId =
    selectedSkillId && relatedSkillIds && !relatedSkillIds.has(selectedSkillId)
      ? null
      : selectedSkillId
  const selectedSkill = inspectedSkillId ? getSkill(inspectedSkillId) : null
  // Mode attribute is also driven by GSAP during transitions; keep a coherent fallback.
  const mode = storyFocusActive ? 'story-focus' : 'explore'

  return (
    <section
      ref={sectionRef}
      id="expertise"
      className="skills-section"
      data-skills-mode={mode}
      data-skills-entrance="pending"
      aria-label="Skills"
    >
      <div className="skills-section__shell">
        <div className="skills-section__keyboard-panel">
          <div className="skills-section__board">
            <div ref={inspectionRef} className="skills-section__inspection-slot">
              <SkillInspection skill={selectedSkill} />
            </div>

            <div
              ref={stageRef}
              className="skills-section__stage"
              aria-label="Interactive skills keyboard"
            >
              <div className="skills-section__stars" aria-hidden />
              <Suspense fallback={<SkillsKeyboardFallback activeCategory={displayCategory} />}>
                <SkillsKeyboardCanvas
                  enabled={webgl}
                  displayCategory={displayCategory}
                  selectedSkillId={inspectedSkillId}
                  relatedSkillIds={relatedSkillIds}
                  isFlipping={isFlipping}
                  flipNonce={flipNonce}
                  onEngageSkill={handleEngageSkill}
                  onClearInspection={handleClearInspection}
                  onFlipSwap={handleFlipSwap}
                  onFlipComplete={handleFlipComplete}
                />
              </Suspense>
            </div>

            <div ref={footerRef} className="skills-section__board-footer">
              {!storyFocusActive ? (
                <SkillCategorySelector
                  activeCategory={activeCategory}
                  onSelect={handleSelectCategory}
                  locked={isFlipping}
                />
              ) : null}
              <SkillSoundToggle
                enabled={soundEnabled}
                onToggle={toggleSound}
                disabled={isFlipping}
              />
            </div>
          </div>
        </div>

        <StoriesPanel
          panelRef={storiesRef}
          focusedStoryId={focusedStoryId}
          reducedMotion={reducedMotion}
          onOpenStory={handleOpenStory}
          onCloseStoryStart={handleCloseStoryStart}
          onCloseStory={handleCloseStory}
          onFocusPhaseChange={setStoryPhase}
        />
      </div>
    </section>
  )
}
