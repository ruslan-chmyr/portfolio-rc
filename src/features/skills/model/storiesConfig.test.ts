import { describe, expect, it } from 'vitest'
import { SKILLS } from './skillsConfig'
import {
  engineeringStories,
  getEngineeringStory,
  getStoryCarouselItems,
} from './storiesConfig'

describe('engineeringStories', () => {
  it('provides four typed stories with replaceable covers', () => {
    expect(engineeringStories).toHaveLength(4)
    for (const story of engineeringStories) {
      expect(story.id).toBeTruthy()
      expect(story.title).toBeTruthy()
      expect(story.cover.startsWith('data:image/svg+xml')).toBe(true)
      expect(['fe', 'ai']).toContain(story.category)
      expect(story.relatedSkillIds.length).toBeGreaterThan(0)
    }
  })

  it('references only existing skill catalog ids', () => {
    for (const story of engineeringStories) {
      for (const skillId of story.relatedSkillIds) {
        expect(SKILLS[skillId]).toBeTruthy()
      }
    }
  })

  it('omits empty narrative fields rather than inventing filler', () => {
    for (const story of engineeringStories) {
      if (story.challenge !== undefined) expect(story.challenge.trim()).not.toBe('')
      if (story.approach !== undefined) expect(story.approach.trim()).not.toBe('')
      if (story.outcome !== undefined) expect(story.outcome.trim()).not.toBe('')
    }
  })

  it('maps carousel items from the central catalog', () => {
    const items = getStoryCarouselItems()
    expect(items).toHaveLength(engineeringStories.length)
    expect(getEngineeringStory('performance-engineering')?.title).toMatch(/Performance/)
    expect(getEngineeringStory('missing')).toBeNull()
  })
})
