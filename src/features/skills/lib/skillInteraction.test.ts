import { describe, expect, it } from 'vitest'
import { resolveSkillInspection } from './skillSelection'
import {
  shouldClearInspectionOnPointerLeave,
  shouldPlayEngageSound,
} from './skillEngagement'

describe('skill inspection interaction contract', () => {
  it('hover engage replaces the inspected skill', () => {
    expect(resolveSkillInspection(null, 'react')).toBe('react')
    expect(resolveSkillInspection('react', 'typescript')).toBe('typescript')
  })

  it('pointer leave restores idle only for mouse/pen', () => {
    expect(
      shouldClearInspectionOnPointerLeave({ isFlipping: false, leavePointerType: 'mouse' }),
    ).toBe(true)
    expect(
      shouldClearInspectionOnPointerLeave({ isFlipping: false, leavePointerType: 'touch' }),
    ).toBe(false)
  })

  it('sound plays only when explicitly requested', () => {
    expect(shouldPlayEngageSound({ playSound: true })).toBe(true)
    expect(shouldPlayEngageSound({ playSound: false, modality: 'mouse' })).toBe(false)
  })

  it('clearing inspection is represented as null selection', () => {
    const engaged = resolveSkillInspection(null, 'vite')
    expect(engaged).toBe('vite')
    const cleared: string | null = null
    expect(cleared).toBeNull()
  })
})
