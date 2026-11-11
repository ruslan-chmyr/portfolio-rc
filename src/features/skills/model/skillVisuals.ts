import type { SkillDefinition, SkillId } from './skillsConfig'
import { getSkill } from './skillsConfig'

export type SkillVisual = {
  /** Keycap face accent. */
  accent: string
  /** Legend / icon tint. */
  legend: string
  /** Optional SVG asset URL (existing brand marks only). */
  iconUrl?: string
}

const DEFAULT_ACCENT = '#3A3A40'
const DEFAULT_LEGEND = '#FFFFFF'

/** Derive keycap styling from the centralized skill definition. */
export function getSkillVisual(id: SkillId): SkillVisual
export function getSkillVisual(skill: SkillDefinition): SkillVisual
export function getSkillVisual(skillOrId: SkillId | SkillDefinition): SkillVisual {
  const skill = typeof skillOrId === 'string' ? getSkill(skillOrId) : skillOrId
  return {
    accent: skill.color ?? DEFAULT_ACCENT,
    legend: skill.legend ?? DEFAULT_LEGEND,
    iconUrl: skill.icon,
  }
}

export function mixHex(hex: string, toward: string, amount: number): string {
  const parse = (value: string) => {
    const raw = value.replace('#', '')
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ] as const
  }

  const [ar, ag, ab] = parse(hex)
  const [br, bg, bb] = parse(toward)
  const t = Math.min(1, Math.max(0, amount))
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHex(ar + (br - ar) * t)}${toHex(ag + (bg - ag) * t)}${toHex(ab + (bb - ab) * t)}`
}
