import { useCallback, useId, useRef, type KeyboardEvent } from 'react'
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
 * Segmented FE / AI board control — two equal centered buttons in one pill.
 */
export function SkillCategorySelector({
  activeCategory,
  onSelect,
  locked = false,
}: SkillCategorySelectorProps) {
  const labelId = useId()
  const groupRef = useRef<HTMLDivElement | null>(null)
  const feAvailable = canSelectSkillBoardCategory('fe')
  const aiAvailable = canSelectSkillBoardCategory('ai')

  const selectCategory = useCallback(
    (category: SkillBoardCategory) => {
      if (locked) return
      if (!canSelectSkillBoardCategory(category)) return
      if (category !== activeCategory) onSelect(category)
    },
    [activeCategory, locked, onSelect],
  )

  const focusCategoryButton = (category: SkillBoardCategory) => {
    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('button')
    if (!buttons?.length) return
    const target = category === 'fe' ? buttons[0] : buttons[1]
    // Disabled segments are not focusable — keep focus on the active control.
    if (!target || target.disabled) return
    target.focus()
  }

  const onGroupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      selectCategory('ai')
      focusCategoryButton('ai')
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      selectCategory('fe')
      focusCategoryButton('fe')
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectCategory('fe')
      focusCategoryButton('fe')
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectCategory('ai')
      focusCategoryButton('ai')
    }
  }

  return (
    <div
      ref={groupRef}
      className={[
        'skills-category-seg',
        locked ? 'skills-category-seg--locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-labelledby={labelId}
      aria-disabled={locked || undefined}
      onKeyDown={onGroupKeyDown}
    >
      <span id={labelId} className="skills-keyboard-a11y">
        Skill board category
      </span>
      <button
        type="button"
        className={[
          'skills-category-seg__btn',
          activeCategory === 'fe' ? 'skills-category-seg__btn--active' : '',
          activeCategory === 'fe' ? 'skills-category-seg__btn--fe' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-pressed={activeCategory === 'fe'}
        aria-label="Frontend skills board"
        disabled={!feAvailable || (locked && activeCategory !== 'fe')}
        onClick={() => selectCategory('fe')}
      >
        FE
      </button>
      <button
        type="button"
        className={[
          'skills-category-seg__btn',
          activeCategory === 'ai' ? 'skills-category-seg__btn--active' : '',
          activeCategory === 'ai' ? 'skills-category-seg__btn--ai' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-pressed={activeCategory === 'ai'}
        aria-label="AI skills board"
        disabled={!aiAvailable || (locked && activeCategory !== 'ai')}
        onClick={() => selectCategory('ai')}
      >
        AI
      </button>
    </div>
  )
}
