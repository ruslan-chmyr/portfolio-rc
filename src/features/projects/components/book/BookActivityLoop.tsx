import { useFrame, useThree } from '@react-three/fiber'
import type { MutableRefObject } from 'react'

/** Keep demand frameloop alive while bones / orbit damping / resets settle. */
export function BookActivityLoop({
  activityUntil,
  enabled,
}: {
  activityUntil: MutableRefObject<number>
  enabled: boolean
}) {
  const invalidate = useThree((s) => s.invalidate)
  useFrame(() => {
    if (!enabled) return
    if (performance.now() < activityUntil.current) {
      invalidate()
    }
  })
  return null
}
