import { createPortal } from 'react-dom'
import { useTrailingCursor } from '../../hooks/useTrailingCursor'
import './TrailingCursor.css'

type TrailingCursorProps = {
  enabled?: boolean
}

export function TrailingCursor({ enabled = true }: TrailingCursorProps) {
  const { dotRef, ringRef, supported } = useTrailingCursor(enabled)

  if (!supported || typeof document === 'undefined') return null

  return createPortal(
    <div className="trailing-cursor" aria-hidden>
      <div ref={ringRef} className="trailing-cursor__ring" />
      <div ref={dotRef} className="trailing-cursor__dot" />
    </div>,
    document.body,
  )
}
