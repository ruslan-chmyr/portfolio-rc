import {
  useCallback,
  useId,
  useRef,
  type KeyboardEvent,
} from 'react'
import {
  SKILL_BOARD_CATEGORIES,
  SKILL_BOARD_CATEGORY_CONFIG,
  canSelectSkillBoardCategory,
  type SkillBoardCategory,
} from '../model/skillsConfig'

type SkillCategorySelectorProps = {
  activeCategory: SkillBoardCategory
  onSelect: (category: SkillBoardCategory) => void
  /**
   * Interaction lock during the 360° flip.
   * Keeps the active button focusable (not HTML-disabled) so focus is not dropped to <body>.
   */
  locked?: boolean
}

function enabledCategories() {
  return SKILL_BOARD_CATEGORIES.filter((category) => canSelectSkillBoardCategory(category))
}

/**
 * Category control — button group with roving tabindex and arrow-key movement.
 * Focus always follows the selected enabled category.
 */
export function SkillCategorySelector({
  activeCategory,
  onSelect,
  locked = false,
}: SkillCategorySelectorProps) {
  const labelId = useId()
  const buttonRefs = useRef<Partial<Record<SkillBoardCategory, HTMLButtonElement | null>>>(
    {},
  )

  const focusCategory = useCallback((category: SkillBoardCategory) => {
    const node = buttonRefs.current[category]
    if (!node || node.disabled) return
    // Defer so React can commit aria-pressed / tabIndex before focus moves.
    requestAnimationFrame(() => {
      buttonRefs.current[category]?.focus()
    })
  }, [])

  const selectCategory = useCallback(
    (category: SkillBoardCategory) => {
      if (locked) return
      if (!canSelectSkillBoardCategory(category)) return
      if (category !== activeCategory) onSelect(category)
      focusCategory(category)
    },
    [activeCategory, focusCategory, locked, onSelect],
  )

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (locked) return
      const enabled = enabledCategories()
      if (enabled.length === 0) return
      const currentIndex = Math.max(0, enabled.indexOf(activeCategory))
      const next = enabled[(currentIndex + direction + enabled.length) % enabled.length]
      if (next) selectCategory(next)
    },
    [activeCategory, locked, selectCategory],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveSelection(1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveSelection(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      const first = enabledCategories()[0]
      if (first) selectCategory(first)
    } else if (event.key === 'End') {
      event.preventDefault()
      const enabled = enabledCategories()
      const last = enabled[enabled.length - 1]
      if (last) selectCategory(last)
    }
  }

  return (
    <div
      className="skills-category-selector"
      role="group"
      aria-labelledby={labelId}
      aria-busy={locked || undefined}
      onKeyDown={onKeyDown}
    >
      <span id={labelId} className="skills-keyboard-a11y">
        Skill categories
      </span>
      {SKILL_BOARD_CATEGORIES.map((category) => {
        const config = SKILL_BOARD_CATEGORY_CONFIG[category]
        const available = canSelectSkillBoardCategory(category)
        const selected = activeCategory === category
        // Only permanently unavailable options use HTML disabled (e.g. Node.js).
        // Flip lock uses aria-disabled so the focused control is not removed from the tab order.
        const htmlDisabled = !available

        return (
          <button
            key={category}
            ref={(node) => {
              buttonRefs.current[category] = node
            }}
            type="button"
            aria-pressed={selected}
            aria-disabled={!available || locked}
            disabled={htmlDisabled}
            tabIndex={htmlDisabled ? -1 : selected ? 0 : -1}
            className={[
              'skills-category-selector__key',
              selected ? 'skills-category-selector__key--active' : '',
              !available ? 'skills-category-selector__key--disabled' : '',
              locked ? 'skills-category-selector__key--locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (!available || locked || selected) return
              selectCategory(category)
            }}
          >
            <span className="skills-category-selector__label">{config.label}</span>
            {!available && config.soonLabel ? (
              <span className="skills-category-selector__soon">{config.soonLabel}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
