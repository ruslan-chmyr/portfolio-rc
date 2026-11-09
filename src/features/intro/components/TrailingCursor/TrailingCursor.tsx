import { useTrailingCursor } from '../../hooks/useTrailingCursor'
import './TrailingCursor.css'

type TrailingCursorProps = {
  enabled?: boolean
}

export function TrailingCursor({ enabled = true }: TrailingCursorProps) {
  const { dotRef, ringRef, supported } = useTrailingCursor(enabled)

  if (!supported) return null

  return (
    <div className="trailing-cursor" aria-hidden>
      <div ref={ringRef} className="trailing-cursor__ring" />
      <div ref={dotRef} className="trailing-cursor__dot" />
    </div>
  )
}
