import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  canCloseBook,
  canOpenBook,
  canTurnBook,
  createInitialBookState,
  reduceBookState,
  type ProjectBookEvent,
  type ProjectBookMachineState,
} from '../lib/bookStateMachine'
import { PROJECT_BOOK_SCENE } from '../model/projectBookConfig'

type Options = {
  spreadCount: number
  reducedMotion: boolean
}

function reducer(
  state: ProjectBookMachineState,
  event: ProjectBookEvent & { spreadCount: number },
): ProjectBookMachineState {
  return reduceBookState(state, event, event.spreadCount)
}

export function useProjectBookController({
  spreadCount,
  reducedMotion,
}: Options) {
  const [state, rawDispatch] = useReducer(reducer, undefined, createInitialBookState)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
  }, [])

  const dispatch = useCallback(
    (event: ProjectBookEvent) => {
      rawDispatch({ ...event, spreadCount })
    },
    [spreadCount],
  )

  useEffect(() => () => clearTimers(), [clearTimers])

  const open = useCallback(() => {
    if (!canOpenBook(state)) return
    dispatch({ type: 'OPEN' })
    const delay = reducedMotion ? 0 : PROJECT_BOOK_SCENE.openDurationMs
    const id = window.setTimeout(() => dispatch({ type: 'OPENED' }), delay)
    timers.current.push(id)
  }, [dispatch, reducedMotion, state])

  const close = useCallback(() => {
    if (!canCloseBook(state)) return
    dispatch({ type: 'CLOSE' })
    const delay = reducedMotion ? 0 : PROJECT_BOOK_SCENE.openDurationMs
    const id = window.setTimeout(() => dispatch({ type: 'CLOSED' }), delay)
    timers.current.push(id)
  }, [dispatch, reducedMotion, state])

  const turn = useCallback(
    (direction: 1 | -1) => {
      if (!canTurnBook(state, direction, spreadCount)) return
      dispatch({ type: 'TURN_START', direction })
      const delay = reducedMotion ? 0 : PROJECT_BOOK_SCENE.flipDurationMs
      const id = window.setTimeout(() => dispatch({ type: 'TURN_END' }), delay)
      timers.current.push(id)
    },
    [dispatch, reducedMotion, spreadCount, state],
  )

  return {
    state,
    open,
    close,
    turnNext: () => turn(1),
    turnPrev: () => turn(-1),
    isInteractive: state.phase === 'closed' || state.phase === 'open',
  }
}
