import { describe, expect, it } from 'vitest'
import {
  hasSkillDescription,
  resolveSkillInspection,
  resolveSkillSelection,
} from './skillSelection'

describe('resolveSkillInspection', () => {
  it('always lands on the engaged skill without clearing', () => {
    expect(resolveSkillInspection(null, 'typescript')).toBe('typescript')
    expect(resolveSkillInspection('typescript', 'react')).toBe('react')
    expect(resolveSkillInspection('react', 'react')).toBe('react')
  })
})

describe('resolveSkillSelection', () => {
  it('aliases sticky inspection', () => {
    expect(resolveSkillSelection(null, 'typescript')).toBe('typescript')
    expect(resolveSkillSelection('typescript', 'react')).toBe('react')
    expect(resolveSkillSelection('react', 'react')).toBe('react')
  })
})

describe('hasSkillDescription', () => {
  it('rejects empty or whitespace-only copy', () => {
    expect(hasSkillDescription('')).toBe(false)
    expect(hasSkillDescription(' \n\t ')).toBe(false)
    expect(hasSkillDescription('Real copy')).toBe(true)
  })
})
