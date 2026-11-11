import { describe, expect, it } from 'vitest'
import { resolveStoryKeyVisual, toRelatedSkillSet } from './storyHighlight'

describe('resolveStoryKeyVisual', () => {
  it('stays idle when no story focus set is active', () => {
    expect(resolveStoryKeyVisual('react', null)).toBe('idle')
    expect(resolveStoryKeyVisual('react', new Set())).toBe('idle')
  })

  it('marks related and muted skills independently from selection', () => {
    const related = new Set(['react', 'typescript'])
    expect(resolveStoryKeyVisual('react', related)).toBe('related')
    expect(resolveStoryKeyVisual('vite', related)).toBe('muted')
    expect(resolveStoryKeyVisual(null, related)).toBe('muted')
  })

  it('treats empty related sets as inactive story focus', () => {
    expect(resolveStoryKeyVisual('react', new Set())).toBe('idle')
  })
})

describe('toRelatedSkillSet', () => {
  it('returns null for empty input and a set otherwise', () => {
    expect(toRelatedSkillSet(null)).toBeNull()
    expect(toRelatedSkillSet([])).toBeNull()
    expect(toRelatedSkillSet(['react', 'vite'])).toEqual(new Set(['react', 'vite']))
  })
})
