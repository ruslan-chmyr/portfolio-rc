import { useEffect, useId, useState, type ReactNode } from 'react'
import { PROJECT_BOOK_META } from '../../model/projectBookConfig'
import { useBookGesture } from './BookGestureContext'

type BookToolbarProps = {
  page: number
  fullscreen: boolean
  onResetView: () => void
  onCloseBook: () => void
  onToggleFullscreen: () => void
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M3.5 12a8.5 8.5 0 1 0 2.2-5.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3.2 4.8v4.2h4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconZoomOut() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle
        cx="10.5"
        cy="10.5"
        r="6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M15.2 15.2 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 10.5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconZoomIn() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle
        cx="10.5"
        cy="10.5"
        r="6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M15.2 15.2 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.5 8v5M8 10.5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconBookClosed() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M5 5.5c0-.8.7-1.5 1.5-1.5H18v15.5H6.5A1.5 1.5 0 0 1 5 18V5.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 7.5h7.2M8.2 11h5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMaximize() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMinimize() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 9H4.5V4.5M15 9h4.5V4.5M9 15H4.5v4.5M15 15h4.5v4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type ToolButtonProps = {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolButton({ label, disabled, onClick, children }: ToolButtonProps) {
  const tipId = useId()
  return (
    <button
      type="button"
      className="book-toolbar__btn"
      aria-label={label}
      aria-describedby={tipId}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="book-toolbar__tip" id={tipId} role="tooltip">
        {label}
      </span>
      <span className="book-toolbar__icon">{children}</span>
    </button>
  )
}

/**
 * Minimal glass control strip — bottom-left of the Projects panel.
 * Separate from the WebGL tree; talks to OrbitControls via cameraApiRef.
 */
export function BookToolbar({
  page,
  fullscreen,
  onResetView,
  onCloseBook,
  onToggleFullscreen,
}: BookToolbarProps) {
  const { cameraApiRef } = useBookGesture()
  const [canZoomIn, setCanZoomIn] = useState(true)
  const [canZoomOut, setCanZoomOut] = useState(true)

  useEffect(() => {
    return cameraApiRef.current.subscribe((bounds) => {
      setCanZoomIn(bounds.canZoomIn)
      setCanZoomOut(bounds.canZoomOut)
    })
  }, [cameraApiRef])

  return (
    <div
      className="book-toolbar"
      role="toolbar"
      aria-label="Book view controls"
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <ToolButton label={PROJECT_BOOK_META.resetViewLabel} onClick={onResetView}>
        <IconReset />
      </ToolButton>
      <ToolButton
        label={PROJECT_BOOK_META.zoomOutLabel}
        disabled={!canZoomOut}
        onClick={() => cameraApiRef.current.zoomOut()}
      >
        <IconZoomOut />
      </ToolButton>
      <ToolButton
        label={PROJECT_BOOK_META.zoomInLabel}
        disabled={!canZoomIn}
        onClick={() => cameraApiRef.current.zoomIn()}
      >
        <IconZoomIn />
      </ToolButton>
      <ToolButton
        label={PROJECT_BOOK_META.closeBookLabel}
        disabled={page <= 0}
        onClick={onCloseBook}
      >
        <IconBookClosed />
      </ToolButton>
      <ToolButton
        label={
          fullscreen
            ? PROJECT_BOOK_META.fullscreenExitLabel
            : PROJECT_BOOK_META.fullscreenEnterLabel
        }
        onClick={onToggleFullscreen}
      >
        {fullscreen ? <IconMinimize /> : <IconMaximize />}
      </ToolButton>
    </div>
  )
}
