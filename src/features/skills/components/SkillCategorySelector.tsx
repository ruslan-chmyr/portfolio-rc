import {
  useCallback,
  useId,
  useRef,
  type KeyboardEvent,
} from 'react'
import {
  canSelectSkillBoardCategory,
  type SkillBoardCategory,
} from '../model/skillsConfig'

type SkillCategorySelectorProps = {
  activeCategory: SkillBoardCategory
  onSelect: (category: SkillBoardCategory) => void
  /**
   * Interaction lock during the 360° flip.
   * Keeps the control focusable so focus is not dropped to <body>.
   */
  locked?: boolean
}

/**
 * Neumorphic FE ↔ AI board switch.
 * Single control with a sliding knob; arrows also move between boards.
 */
export function SkillCategorySelector({
  activeCategory,
  onSelect,
  locked = false,
}: SkillCategorySelectorProps) {
  const labelId = useId()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const isFe = activeCategory === 'fe'
  const feAvailable = canSelectSkillBoardCategory('fe')
  const aiAvailable = canSelectSkillBoardCategory('ai')
  const canToggle = feAvailable && aiAvailable

  const selectCategory = useCallback(
    (category: SkillBoardCategory) => {
      if (locked) return
      if (!canSelectSkillBoardCategory(category)) return
      if (category !== activeCategory) onSelect(category)
    },
    [activeCategory, locked, onSelect],
  )

  const toggle = useCallback(() => {
    if (locked || !canToggle) return
    selectCategory(isFe ? 'ai' : 'fe')
  }, [canToggle, isFe, locked, selectCategory])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      selectCategory('ai')
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      selectCategory('fe')
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectCategory('fe')
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectCategory('ai')
    }
  }

  return (
    <div className="skills-category-selector" aria-labelledby={labelId}>
      <span id={labelId} className="skills-keyboard-a11y">
        Skill board category
      </span>
      <button
        ref={buttonRef}
        type="button"
        className={[
          'skills-category-toggle',
          isFe ? 'skills-category-toggle--fe' : 'skills-category-toggle--ai',
          locked ? 'skills-category-toggle--locked' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="switch"
        aria-checked={!isFe}
        aria-label="Toggle skill board between FE and AI"
        aria-disabled={locked || !canToggle}
        aria-busy={locked || undefined}
        disabled={!canToggle}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span className="skills-category-toggle__switch" aria-hidden />
        <span
          className={[
            'skills-category-toggle__side',
            'skills-category-toggle__side--fe',
            isFe ? 'skills-category-toggle__side--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          FE
        </span>
        <span
          className={[
            'skills-category-toggle__side',
            'skills-category-toggle__side--ai',
            !isFe ? 'skills-category-toggle__side--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          AI
        </span>
      </button>
    </div>
  )
}
