import type { KeyboardEvent } from 'react'
import type { SkillEngageOptions } from '../lib/skillEngagement'
import { getSkillsForBoard, type SkillBoardCategory, type SkillId } from '../model/skillsConfig'

type SkillsKeyboardA11yProps = {
  category: SkillBoardCategory
  selectedSkillId: SkillId | null
  relatedSkillIds?: ReadonlySet<string> | null
  disabled?: boolean
  onEngageSkill: (skillId: SkillId, options?: SkillEngageOptions) => void
}

/**
 * Screen-reader / keyboard path for Skill Inspection when the WebGL board is active.
 * Focus updates inspection without sound; Enter/Space activates with sound once.
 */
export function SkillsKeyboardA11y({
  category,
  selectedSkillId,
  relatedSkillIds = null,
  disabled = false,
  onEngageSkill,
}: SkillsKeyboardA11yProps) {
  const skills = getSkillsForBoard(category)

  return (
    <ul className="skills-keyboard-a11y" aria-label="Skill keys">
      {skills.map((skill) => {
        const selected = selectedSkillId === skill.id
        const skillId = skill.id as SkillId
        const storyMuted = Boolean(relatedSkillIds && !relatedSkillIds.has(skillId))
        const keyDisabled = disabled || storyMuted

        const activate = (withSound: boolean) => {
          if (keyDisabled) return
          onEngageSkill(skillId, { playSound: withSound, modality: 'keyboard' })
        }

        return (
          <li key={skill.id}>
            <button
              type="button"
              className="skills-keyboard-a11y__key"
              disabled={keyDisabled}
              aria-pressed={selected}
              aria-label={skill.name}
              onFocus={() => activate(false)}
              onClick={(event) => {
                // Click already follows focus for mouse users of this SR list;
                // skip a second engage when focus just selected the same skill.
                if (selected) {
                  event.preventDefault()
                  return
                }
                activate(true)
              }}
              onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                activate(true)
              }}
            >
              {skill.name}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
