import { useState } from 'react'
import { hasSkillDescription } from '../lib/skillSelection'
import type { SkillDefinition } from '../model/skillsConfig'

type SkillInspectionProps = {
  skill: SkillDefinition | null
}

function InspectionIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      className="skills-inspection__icon"
      src={src}
      alt={alt}
      width={28}
      height={28}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Fixed-slot Skill Inspection — content swaps with a short opacity fade
 * without changing the reserved layout height above the keyboard.
 */
export function SkillInspection({ skill }: SkillInspectionProps) {
  const selected = Boolean(skill)
  const description = skill?.description ?? ''
  const showDescription = hasSkillDescription(description)

  return (
    <div
      className="skills-inspection"
      data-mode={selected ? 'skill' : 'idle'}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="skills-inspection__plane"
        key={skill ? skill.id : 'idle'}
      >
        {skill ? (
          <>
            <div className="skills-inspection__title">
              {skill.icon ? <InspectionIcon src={skill.icon} alt="" /> : null}
              <h3 className="skills-inspection__name">{skill.name}</h3>
            </div>
            {showDescription ? (
              <p className="skills-inspection__description">{description}</p>
            ) : null}
          </>
        ) : (
          <>
            <h3 className="skills-inspection__name">Explore my skills</h3>
            <p className="skills-inspection__lede">Hover, tap, or press a key.</p>
          </>
        )}
      </div>
    </div>
  )
}
