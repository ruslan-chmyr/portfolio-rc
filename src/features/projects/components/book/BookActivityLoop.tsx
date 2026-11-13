import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import { useBookGesture } from './BookGestureContext'

/** Keep demand frameloop alive while bones / orbit damping / texture uploads settle. */
export function BookActivityLoop({
  activityUntil,
  enabled,
}: {
  activityUntil: MutableRefObject<number>
  enabled: boolean
}) {
  const invalidate = useThree((s) => s.invalidate)
  const { registerInvalidate } = useBookGesture()

  useEffect(() => {
    if (!enabled) {
      registerInvalidate(null)
      return
    }
    registerInvalidate(invalidate)
    return () => registerInvalidate(null)
  }, [enabled, invalidate, registerInvalidate])

  useFrame(() => {
    if (!enabled) return
    if (performance.now() < activityUntil.current) {
      invalidate()
    }
  })
  return null
}
