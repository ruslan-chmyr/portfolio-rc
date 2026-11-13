import {
  createContext,
  useCallback,
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
  /**
   * Extend the demand-render activity window and request a frame when the
   * Canvas invalidate bridge is registered.
   */
  bumpActivity: BookActivityBumper
  activityUntil: MutableRefObject<number>
  /** Wired from inside the Canvas so idle scenes can wake for texture uploads. */
  registerInvalidate: (fn: (() => void) | null) => void
}

const BookGestureContext = createContext<BookGestureContextValue | null>(null)

export function BookGestureProvider({
  children,
  bumpActivity,
  activityUntil,
  invalidateSlot,
}: {
  children: ReactNode
  bumpActivity: BookActivityBumper
  activityUntil: MutableRefObject<number>
  /** Shared with the scene so HTML-side bumps also wake demand rendering. */
  invalidateSlot: MutableRefObject<(() => void) | null>
}) {
  const gesture = useRef(createBookGestureState())
  const cameraApiRef = useRef<BookCameraApi>(createEmptyBookCameraApi())

  const registerInvalidate = useCallback(
    (fn: (() => void) | null) => {
      invalidateSlot.current = fn
    },
    [invalidateSlot],
  )

  const value = useMemo(
    () => ({
      gesture,
      cameraApiRef,
      bumpActivity,
      activityUntil,
      registerInvalidate,
    }),
    [activityUntil, bumpActivity, registerInvalidate],
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
