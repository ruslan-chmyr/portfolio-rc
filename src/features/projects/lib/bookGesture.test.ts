import { describe, expect, it } from 'vitest'
import {
  beginBookPointer,
  claimGestureOwner,
  createBookGestureState,
  endBookPointer,
  isBookOwnedGesture,
  isOrbitOwnedGesture,
  moveBookPointer,
  setBookOrbiting,
  shouldSuppressPageClick,
} from './bookGesture'

describe('bookGesture', () => {
  it('allows a clean book click without movement', () => {
    const state = createBookGestureState()
    beginBookPointer(state, 5, 5, 'book', 3)
    moveBookPointer(state, 7, 6)
    expect(state.dragged).toBe(false)
    expect(shouldSuppressPageClick(state)).toBe(false)
  })

  it('promotes book press to orbit after drag threshold', () => {
    const state = createBookGestureState()
    beginBookPointer(state, 0, 0, 'book', 1)
    expect(isBookOwnedGesture(state)).toBe(true)
    expect(shouldSuppressPageClick(state)).toBe(false)

    const promoted = moveBookPointer(state, 20, 0)
    expect(promoted).toBe(true)
    expect(state.dragged).toBe(true)
    expect(isOrbitOwnedGesture(state)).toBe(true)
    expect(shouldSuppressPageClick(state)).toBe(true)
  })

  it('does not suppress page click when OrbitControls starts before movement', () => {
    const state = createBookGestureState()
    beginBookPointer(state, 0, 0, 'book', 2)
    setBookOrbiting(state, true)
    expect(state.orbiting).toBe(true)
    expect(state.dragged).toBe(false)
    expect(shouldSuppressPageClick(state)).toBe(false)
  })

  it('suppresses page clicks for empty-scene orbit gestures', () => {
    const state = createBookGestureState()
    beginBookPointer(state, 0, 0, 'orbit', 4)
    expect(shouldSuppressPageClick(state)).toBe(true)
  })

  it('allows one-way book → orbit claim', () => {
    const state = createBookGestureState()
    beginBookPointer(state, 10, 10, 'book', 5)
    claimGestureOwner(state, 'orbit')
    expect(isOrbitOwnedGesture(state)).toBe(true)
    claimGestureOwner(state, 'book')
    expect(isOrbitOwnedGesture(state)).toBe(true)
    endBookPointer(state)
    expect(state.owner).toBe('none')
  })
})
