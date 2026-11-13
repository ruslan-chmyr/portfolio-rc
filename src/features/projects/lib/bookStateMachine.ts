export type ProjectBookPhase =
  | 'closed'
  | 'opening'
  | 'open'
  | 'turning'
  | 'closing'

export type ProjectBookEvent =
  | { type: 'OPEN' }
  | { type: 'OPENED' }
  | { type: 'TURN_START'; direction: 1 | -1 }
  | { type: 'TURN_END' }
  | { type: 'CLOSE' }
  | { type: 'CLOSED' }

export type ProjectBookMachineState = {
  phase: ProjectBookPhase
  /** Index of the active project spread (0-based). */
  spreadIndex: number
  turnDirection: 1 | -1 | 0
}

export function createInitialBookState(): ProjectBookMachineState {
  return { phase: 'closed', spreadIndex: 0, turnDirection: 0 }
}

export function canOpenBook(state: ProjectBookMachineState): boolean {
  return state.phase === 'closed'
}

export function canCloseBook(state: ProjectBookMachineState): boolean {
  return state.phase === 'open'
}

export function canTurnBook(
  state: ProjectBookMachineState,
  direction: 1 | -1,
  spreadCount: number,
): boolean {
  if (state.phase !== 'open' || spreadCount <= 0) return false
  const next = state.spreadIndex + direction
  return next >= 0 && next < spreadCount
}

/**
 * Pure transition helper — keeps phase changes deterministic and race-safe.
 */
export function reduceBookState(
  state: ProjectBookMachineState,
  event: ProjectBookEvent,
  spreadCount: number,
): ProjectBookMachineState {
  switch (event.type) {
    case 'OPEN':
      if (!canOpenBook(state)) return state
      return { ...state, phase: 'opening', turnDirection: 0 }
    case 'OPENED':
      if (state.phase !== 'opening') return state
      return { ...state, phase: 'open' }
    case 'CLOSE':
      if (!canCloseBook(state)) return state
      return { ...state, phase: 'closing', turnDirection: 0 }
    case 'CLOSED':
      if (state.phase !== 'closing') return state
      return { phase: 'closed', spreadIndex: 0, turnDirection: 0 }
    case 'TURN_START': {
      if (!canTurnBook(state, event.direction, spreadCount)) return state
      return {
        ...state,
        phase: 'turning',
        turnDirection: event.direction,
      }
    }
    case 'TURN_END': {
      if (state.phase !== 'turning') return state
      const next = Math.min(
        Math.max(0, state.spreadIndex + state.turnDirection),
        Math.max(0, spreadCount - 1),
      )
      return { phase: 'open', spreadIndex: next, turnDirection: 0 }
    }
    default:
      return state
  }
}
