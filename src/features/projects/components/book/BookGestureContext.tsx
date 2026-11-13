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
import {
  createEmptyBookCameraApi,
  type BookCameraApi,
} from '../../lib/bookCameraApi'

export type BookActivityBumper = (ms?: number) => void

type BookGestureContextValue = {
  gesture: MutableRefObject<BookGestureState>
  /** Imperative camera controls for the HTML toolbar. */
  cameraApiRef: MutableRefObject<BookCameraApi>
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
  const cameraApiRef = useRef<BookCameraApi>(createEmptyBookCameraApi())
  const value = useMemo(
    () => ({ gesture, cameraApiRef, bumpActivity, activityUntil }),
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
