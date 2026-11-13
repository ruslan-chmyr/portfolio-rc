import { describe, expect, it } from 'vitest'
import {
  delayForPageGap,
  isBookPageSettled,
  stepTowardPage,
} from './useDelayedBookPage'

describe('stepTowardPage', () => {
  it('steps forward and backward one sheet at a time', () => {
    expect(stepTowardPage(0, 3)).toBe(1)
    expect(stepTowardPage(2, 0)).toBe(1)
    expect(stepTowardPage(2, 2)).toBe(2)
  })

  it('walks a full close sequence without skipping', () => {
    let page = 5
    const target = 0
    const seen: number[] = [page]
    while (page !== target) {
      page = stepTowardPage(page, target)
      seen.push(page)
    }
    expect(seen).toEqual([5, 4, 3, 2, 1, 0])
    expect(isBookPageSettled(target, page)).toBe(true)
  })

  it('supports reversing mid-sequence', () => {
    let page = stepTowardPage(0, 4)
    expect(page).toBe(1)
    page = stepTowardPage(page, 0)
    expect(page).toBe(0)
  })
})

describe('delayForPageGap / isBookPageSettled', () => {
  it('uses shorter delays for large gaps', () => {
    expect(delayForPageGap(3)).toBe(50)
    expect(delayForPageGap(1)).toBe(150)
  })

  it('detects visual settle against the authoritative target', () => {
    expect(isBookPageSettled(0, 0)).toBe(true)
    expect(isBookPageSettled(0, 2)).toBe(false)
  })
})
