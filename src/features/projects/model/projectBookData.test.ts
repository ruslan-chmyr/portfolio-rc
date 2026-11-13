import { describe, expect, it } from 'vitest'
import { engineeringStories } from '../../skills/model/storiesConfig'
import { getProjectBookEntries, toProjectBookEntry } from './projectBookData'

describe('projectBookData', () => {
  it('maps engineering stories without inventing metrics fields', () => {
    const entry = toProjectBookEntry(engineeringStories[0]!, 0)
    expect(entry.id).toBe(engineeringStories[0]!.id)
    expect(entry.number).toBe('01')
    expect(entry.title).toBe(engineeringStories[0]!.title)
    expect(entry.summary).toBe(engineeringStories[0]!.subtitle)
    expect(entry.challenge).toBe(engineeringStories[0]!.challenge)
    expect(entry.coverImage).toBe(engineeringStories[0]!.cover)
    expect(entry.technologies.length).toBeGreaterThan(0)
    expect(entry.role).toBe('Frontend')
    expect(entry.demoUrl).toBeUndefined()
    expect(entry.repositoryUrl).toBeUndefined()
  })

  it('builds one spread per story', () => {
    expect(getProjectBookEntries()).toHaveLength(engineeringStories.length)
  })
})
