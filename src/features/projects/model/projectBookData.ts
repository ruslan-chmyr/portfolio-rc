import { getSkill } from '../../skills/model/skillsConfig'
import {
  engineeringStories,
  storyCategoryLabel,
  type EngineeringStory,
} from '../../skills/model/storiesConfig'

/**
 * Book-facing project spread. All narrative fields optional so missing copy
 * never invents metrics — pages simply omit empty blocks.
 */
export type ProjectBookEntry = {
  id: string
  number: string
  title: string
  summary: string
  role?: string
  challenge?: string
  solution?: string
  results?: string
  technologies: readonly string[]
  coverImage: string
  demoUrl?: string
  repositoryUrl?: string
}

function technologiesForStory(story: EngineeringStory): readonly string[] {
  return story.relatedSkillIds
    .map((id) => {
      try {
        return getSkill(id).name
      } catch {
        return null
      }
    })
    .filter((label): label is string => Boolean(label))
}

/** Map existing engineering stories into book spreads (no duplicated facts). */
export function toProjectBookEntry(
  story: EngineeringStory,
  index: number,
): ProjectBookEntry {
  return {
    id: story.id,
    number: String(index + 1).padStart(2, '0'),
    title: story.title,
    summary: story.subtitle,
    role: storyCategoryLabel(story.category),
    challenge: story.challenge,
    solution: story.approach,
    results: story.outcome,
    technologies: technologiesForStory(story),
    coverImage: story.cover,
  }
}

export function getProjectBookEntries(
  stories: readonly EngineeringStory[] = engineeringStories,
): readonly ProjectBookEntry[] {
  return stories.map(toProjectBookEntry)
}

export const PROJECT_BOOK_ENTRIES: readonly ProjectBookEntry[] =
  getProjectBookEntries()
