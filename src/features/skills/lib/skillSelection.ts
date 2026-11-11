import type { SkillId } from '../model/skillsConfig'

/**
 * Hover/tap engagement always lands on that skill.
 * Clearing idle copy is handled separately when the pointer leaves the keyboard.
 */
export function resolveSkillInspection(
  _current: SkillId | null,
  engaged: SkillId,
): SkillId {
  return engaged
}

/** Alias used by older call sites. */
export function resolveSkillSelection(
  current: SkillId | null,
  engaged: SkillId,
): SkillId {
  return resolveSkillInspection(current, engaged)
}

/** Empty descriptions must not render placeholder copy. */
export function hasSkillDescription(description: string | undefined | null): boolean {
  return Boolean(description && description.trim().length > 0)
}
