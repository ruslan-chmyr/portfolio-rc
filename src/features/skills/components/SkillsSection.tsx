import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useKeyboardSound } from '../hooks/useKeyboardSound'
import { useSkillCategoryTransition } from '../hooks/useSkillCategoryTransition'
import {
  shouldPlayEngageSound,
  type SkillEngageOptions,
} from '../lib/skillEngagement'
import { resolveSkillInspection } from '../lib/skillSelection'
import { toRelatedSkillSet } from '../lib/storyHighlight'
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
  const [webgl] = useState(() => canUseWebGL())
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion())
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId | null>(null)
  const [focusedStoryId, setFocusedStoryId] = useState<EngineeringStoryId | null>(
    null,
  )
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
      setSelectedSkillId((current) => {
        const next = resolveSkillInspection(current, skillId)
        return current === next ? current : next
      })
      if (shouldPlayEngageSound(options) && soundEnabled) playKeyClick()
    },
    [isFlipping, playKeyClick, soundEnabled],
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
      // Only flip when the Story requires a different board — avoid repeat flips.
      if (story.category !== activeCategory) {
        selectCategory(story.category)
      }
    },
    [activeCategory, selectCategory],
  )

  const handleCloseStory = useCallback(() => {
    setFocusedStoryId(null)
  }, [])

  useEffect(() => {
    if (!focusedStoryId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setFocusedStoryId(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusedStoryId])

  const selectedSkill = selectedSkillId ? getSkill(selectedSkillId) : null
  const mode = focusedStory ? 'story-focus' : 'explore'

  return (
    <section
      id="expertise"
      className="skills-section"
      data-skills-mode={mode}
      aria-labelledby="skills-heading"
    >
      <div className="skills-section__shell">
        <div className="skills-section__keyboard-panel">
          <div className="skills-section__board">
            <header className="skills-section__header">
              <p className="skills-section__eyebrow">02 / Skills</p>
              <h2 id="skills-heading" className="skills-section__title">
                Tech Stack
              </h2>
            </header>

            <div className="skills-section__controls">
              <SkillCategorySelector
                activeCategory={activeCategory}
                onSelect={handleSelectCategory}
                locked={isFlipping}
              />
              <SkillSoundToggle
                enabled={soundEnabled}
                onToggle={toggleSound}
                disabled={isFlipping}
              />
            </div>

            <div className="skills-section__inspection-slot">
              <SkillInspection skill={selectedSkill} />
            </div>

            <div className="skills-section__stage" aria-label="Interactive skills keyboard">
              <div className="skills-section__stars" aria-hidden />
              <Suspense fallback={<SkillsKeyboardFallback activeCategory={displayCategory} />}>
                <SkillsKeyboardCanvas
                  enabled={webgl}
                  displayCategory={displayCategory}
                  selectedSkillId={selectedSkillId}
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
          </div>
        </div>

        <StoriesPanel
          focusedStory={focusedStory}
          paused={Boolean(focusedStory)}
          reducedMotion={reducedMotion}
          onOpenStory={handleOpenStory}
          onCloseStory={handleCloseStory}
        />
      </div>
    </section>
  )
}
