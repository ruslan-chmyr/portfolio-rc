import { lazy, Suspense, useCallback, useState } from 'react'
import { useKeyboardSound } from '../hooks/useKeyboardSound'
import { useSkillCategoryTransition } from '../hooks/useSkillCategoryTransition'
import {
  shouldPlayEngageSound,
  type SkillEngageOptions,
} from '../lib/skillEngagement'
import { resolveSkillInspection } from '../lib/skillSelection'
import { canUseWebGL } from '../lib/webglSupport'
import {
  getSkill,
  type SkillBoardCategory,
  type SkillId,
} from '../model/skillsConfig'
import { SkillCategorySelector } from './SkillCategorySelector'
import { SkillInspection } from './SkillInspection'
import { SkillSoundToggle } from './SkillSoundToggle'
import { SkillsKeyboardFallback } from './SkillsKeyboardFallback'
import '../styles/skills.css'

const SkillsKeyboardCanvas = lazy(() =>
  import('./SkillsKeyboardCanvas').then((module) => ({
    default: module.SkillsKeyboardCanvas,
  })),
)

export function SkillsSection() {
  const [webgl] = useState(() => canUseWebGL())
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId | null>(null)
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

  const selectedSkill = selectedSkillId ? getSkill(selectedSkillId) : null

  return (
    <section
      id="expertise"
      className="skills-section"
      data-skills-mode="explore"
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

        <aside
          className="skills-section__stories-panel"
          aria-hidden
          data-skills-stories-slot
        />
      </div>
    </section>
  )
}
