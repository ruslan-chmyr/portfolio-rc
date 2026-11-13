import { describe, expect, it } from 'vitest'
import {
  beginBookPointer,
  createBookGestureState,
  endBookPointer,
  moveBookPointer,
  shouldSuppressPageClick,
} from './bookGesture'

describe('bookGesture', () => {
  it('suppresses page clicks after drag or while orbiting', () => {
    const state = createBookGestureState()
    beginBookPointer(state, 0, 0)
    expect(shouldSuppressPageClick(state)).toBe(false)
    moveBookPointer(state, 20, 0)
    expect(state.dragged).toBe(true)
    expect(shouldSuppressPageClick(state)).toBe(true)
    endBookPointer(state)
    state.dragged = false
    state.orbiting = true
    expect(shouldSuppressPageClick(state)).toBe(true)
  })
})
