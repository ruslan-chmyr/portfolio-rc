import { describe, expect, it } from 'vitest'
import {
  canTurnBook,
  createInitialBookState,
  reduceBookState,
} from './bookStateMachine'

describe('bookStateMachine', () => {
  it('opens and closes through explicit phases', () => {
    let state = createInitialBookState()
    state = reduceBookState(state, { type: 'OPEN' }, 4)
    expect(state.phase).toBe('opening')
    state = reduceBookState(state, { type: 'OPENED' }, 4)
    expect(state.phase).toBe('open')
    state = reduceBookState(state, { type: 'CLOSE' }, 4)
    expect(state.phase).toBe('closing')
    state = reduceBookState(state, { type: 'CLOSED' }, 4)
    expect(state).toEqual(createInitialBookState())
  })

  it('rejects turns at boundaries and while busy', () => {
    let state = createInitialBookState()
    state = reduceBookState(state, { type: 'OPEN' }, 3)
    state = reduceBookState(state, { type: 'OPENED' }, 3)
    expect(canTurnBook(state, -1, 3)).toBe(false)
    state = reduceBookState(state, { type: 'TURN_START', direction: 1 }, 3)
    expect(state.phase).toBe('turning')
    expect(canTurnBook(state, 1, 3)).toBe(false)
    state = reduceBookState(state, { type: 'TURN_END' }, 3)
    expect(state.spreadIndex).toBe(1)
    expect(state.phase).toBe('open')
  })

  it('ignores rapid open while already opening', () => {
    let state = createInitialBookState()
    state = reduceBookState(state, { type: 'OPEN' }, 2)
    const again = reduceBookState(state, { type: 'OPEN' }, 2)
    expect(again).toEqual(state)
  })
})
