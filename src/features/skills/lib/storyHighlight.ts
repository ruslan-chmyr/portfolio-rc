import type { SkillId } from '../model/skillsConfig'

export type StoryKeyVisual = 'idle' | 'related' | 'muted'

/**
 * Story Focus highlighting is independent from hover/inspection selection.
 * When no story is focused, keys stay visually idle for this layer.
 */
export function resolveStoryKeyVisual(
  skillId: SkillId | string | null | undefined,
  relatedSkillIds: ReadonlySet<string> | null,
): StoryKeyVisual {
  if (!relatedSkillIds || relatedSkillIds.size === 0) return 'idle'
  if (!skillId) return 'muted'
  return relatedSkillIds.has(skillId) ? 'related' : 'muted'
}

export function toRelatedSkillSet(
  relatedSkillIds: readonly string[] | null | undefined,
): Set<string> | null {
  if (!relatedSkillIds || relatedSkillIds.length === 0) return null
  return new Set(relatedSkillIds)
}
