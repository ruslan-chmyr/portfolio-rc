import type { SkillEngageOptions } from '../lib/skillEngagement'
import {
  getSkillsForBoard,
  type SkillBoardCategory,
  type SkillGroup,
  type SkillId,
} from '../model/skillsConfig'

const GROUP_LABELS: Partial<Record<SkillGroup, string>> = {
  core: 'Core',
  'state-data': 'State & Data',
  architecture: 'Architecture',
  performance: 'Performance',
  testing: 'Testing',
  'tooling-ui': 'Tooling & UI',
  automation: 'Automation',
  llm: 'LLM Engineering',
  data: 'Data',
  'ai-dev': 'AI Development',
  integrations: 'Integrations',
}

type SkillsKeyboardFallbackProps = {
  activeCategory: SkillBoardCategory
  selectedSkillId?: SkillId | null
  onEngageSkill?: (skillId: SkillId, options?: SkillEngageOptions) => void
  onClearInspection?: () => void
}

export function SkillsKeyboardFallback({
  activeCategory,
  selectedSkillId = null,
  onEngageSkill,
  onClearInspection,
}: SkillsKeyboardFallbackProps) {
  const skills = getSkillsForBoard(activeCategory)
  const groups = [...new Set(skills.map((skill) => skill.group))]

  if (skills.length === 0) {
    return (
      <div className="skills-fallback">
        <p className="skills-fallback__empty">This category is coming soon.</p>
      </div>
    )
  }

  return (
    <div
      className="skills-fallback"
      role="list"
      onPointerLeave={(event) => {
        if (event.pointerType === 'touch') return
        onClearInspection?.()
      }}
    >
      {groups.map((group) => {
        const groupSkills = skills.filter((skill) => skill.group === group)
        return (
          <div key={group} className="skills-fallback__group">
            <h3 className="skills-fallback__heading">{GROUP_LABELS[group] ?? group}</h3>
            <ul className="skills-fallback__list">
              {groupSkills.map((skill) => {
                const selected = selectedSkillId === skill.id
                return (
                  <li key={skill.id} role="listitem">
                    <button
                      type="button"
                      className={
                        selected
                          ? 'skills-fallback__chip skills-fallback__chip--selected'
                          : 'skills-fallback__chip'
                      }
                      aria-pressed={selected}
                      aria-label={skill.name}
                      onPointerEnter={(event) => {
                        if (event.pointerType === 'touch') return
                        onEngageSkill?.(skill.id as SkillId, {
                          playSound: true,
                          modality: 'mouse',
                        })
                      }}
                      onFocus={() =>
                        onEngageSkill?.(skill.id as SkillId, {
                          playSound: false,
                          modality: 'keyboard',
                        })
                      }
                      onClick={() =>
                        onEngageSkill?.(skill.id as SkillId, {
                          playSound: true,
                          modality: 'touch',
                        })
                      }
                    >
                      <span className="skills-fallback__short">{skill.shortLabel}</span>
                      <span className="skills-fallback__name">{skill.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
