import { createPortal } from 'react-dom'
import { useTrailingCursor } from '../../hooks/useTrailingCursor'
import './TrailingCursor.css'

type TrailingCursorProps = {
  enabled?: boolean
}

export function TrailingCursor({ enabled = true }: TrailingCursorProps) {
  const { rootRef, dotRef, ringRef, supported } = useTrailingCursor(enabled)

  if (!supported || typeof document === 'undefined') return null

  return createPortal(
    <div ref={rootRef} className="trailing-cursor" data-mode="default" aria-hidden>
      <div ref={ringRef} className="trailing-cursor__ring" />
      <div ref={dotRef} className="trailing-cursor__dot" />
    </div>,
    document.body,
  )
}
