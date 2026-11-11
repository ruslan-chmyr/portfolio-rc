import { describe, expect, it } from 'vitest'
import {
  pointerTypeToModality,
  shouldClearInspectionOnPointerLeave,
  shouldPlayEngageSound,
} from './skillEngagement'

describe('pointerTypeToModality', () => {
  it('maps touch separately from mouse/pen', () => {
    expect(pointerTypeToModality('touch')).toBe('touch')
    expect(pointerTypeToModality('mouse')).toBe('mouse')
    expect(pointerTypeToModality('pen')).toBe('mouse')
  })
})

describe('shouldClearInspectionOnPointerLeave', () => {
  it('keeps inspection while flipping or after touch leave', () => {
    expect(
      shouldClearInspectionOnPointerLeave({ isFlipping: true, leavePointerType: 'mouse' }),
    ).toBe(false)
    expect(
      shouldClearInspectionOnPointerLeave({ isFlipping: false, leavePointerType: 'touch' }),
    ).toBe(false)
  })

  it('clears on mouse/pen leave so sticky touch can be dismissed later', () => {
    expect(
      shouldClearInspectionOnPointerLeave({ isFlipping: false, leavePointerType: 'mouse' }),
    ).toBe(true)
    expect(
      shouldClearInspectionOnPointerLeave({ isFlipping: false, leavePointerType: 'pen' }),
    ).toBe(true)
  })
})

describe('shouldPlayEngageSound', () => {
  it('requires an explicit playSound flag', () => {
    expect(shouldPlayEngageSound()).toBe(false)
    expect(shouldPlayEngageSound({})).toBe(false)
    expect(shouldPlayEngageSound({ playSound: false })).toBe(false)
    expect(shouldPlayEngageSound({ playSound: true })).toBe(true)
  })
})
