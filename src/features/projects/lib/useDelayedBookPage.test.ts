import { describe, expect, it } from 'vitest'
import { stepTowardPage } from './useDelayedBookPage'

describe('stepTowardPage', () => {
  it('steps forward and backward one sheet at a time', () => {
    expect(stepTowardPage(0, 3)).toBe(1)
    expect(stepTowardPage(2, 0)).toBe(1)
    expect(stepTowardPage(2, 2)).toBe(2)
  })
})
