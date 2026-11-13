import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import {
  createBookGestureState,
  type BookGestureState,
} from '../../lib/bookGesture'

export type BookActivityBumper = (ms?: number) => void

type BookGestureContextValue = {
  gesture: MutableRefObject<BookGestureState>
  /** Request frames while animations / damping settle. */
  bumpActivity: BookActivityBumper
  activityUntil: MutableRefObject<number>
}

const BookGestureContext = createContext<BookGestureContextValue | null>(null)

export function BookGestureProvider({
  children,
  bumpActivity,
  activityUntil,
}: {
  children: ReactNode
  bumpActivity: BookActivityBumper
  activityUntil: MutableRefObject<number>
}) {
  const gesture = useRef(createBookGestureState())
  const value = useMemo(
    () => ({ gesture, bumpActivity, activityUntil }),
    [bumpActivity, activityUntil],
  )
  return (
    <BookGestureContext.Provider value={value}>
      {children}
    </BookGestureContext.Provider>
  )
}

export function useBookGesture(): BookGestureContextValue {
  const ctx = useContext(BookGestureContext)
  if (!ctx) {
    throw new Error('useBookGesture requires BookGestureProvider')
  }
  return ctx
}
