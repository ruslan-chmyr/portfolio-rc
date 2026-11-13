import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import {
  bookSheetCount,
  maxPageIndex,
  projectIndexForPage,
} from '../../lib/buildBookSheets'
import {
  beginBookPointer,
  endBookPointer,
  moveBookPointer,
} from '../../lib/bookGesture'
import { warmupInitialBookTextures } from '../../lib/sheetFaceTexture'
import {
  PROJECT_BOOK_CAMERA,
  PROJECT_BOOK_META,
  PROJECT_BOOK_SCENE,
} from '../../model/projectBookConfig'
import type { ProjectBookEntry } from '../../model/projectBookData'
import { BookActivityLoop } from './BookActivityLoop'
import { BookGestureProvider, useBookGesture } from './BookGestureContext'
import { BookOrbitRig } from './BookOrbitRig'
import { ProjectBook } from './ProjectBook'
import { ProjectBookFallback } from './ProjectBookFallback'
import { ProjectDetailOverlay } from './ProjectDetailOverlay'

export type ProjectBookSceneProps = {
  entries: readonly ProjectBookEntry[]
  reducedMotion: boolean
  sectionVisible?: boolean
  preferFallback?: boolean
}

function BookLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        intensity={2.05}
        position={[2, 5, 2]}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight intensity={0.35} position={[-2.5, 1.2, -1]} />
    </>
  )
}

function ActiveSpreadAnnouncement({
  entries,
  page,
}: {
  entries: readonly ProjectBookEntry[]
  page: number
}) {
  const index = projectIndexForPage(page, entries.length)
  const active = index === null ? null : entries[index]
  if (!active) {
    return (
      <div className="project-book-scene__sr" aria-live="polite">
        <p>{PROJECT_BOOK_META.coverTitle}</p>
      </div>
    )
  }
  return (
    <div className="project-book-scene__sr" aria-live="polite">
      <h3>{active.title}</h3>
      <p>{active.summary}</p>
      {active.challenge ? <p>Challenge: {active.challenge}</p> : null}
      {active.solution ? <p>Solution: {active.solution}</p> : null}
      {active.results ? <p>Result: {active.results}</p> : null}
      {active.technologies.length ? (
        <p>Technologies: {active.technologies.join(', ')}</p>
      ) : null}
    </div>
  )
}

/** Pointer tracking on the WebGL canvas — separates orbit drags from page clicks. */
function GestureBridge() {
  const { gesture } = useBookGesture()
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const el = gl.domElement
    const onDown = (event: PointerEvent) => {
      beginBookPointer(gesture.current, event.clientX, event.clientY)
    }
    const onMove = (event: PointerEvent) => {
      moveBookPointer(gesture.current, event.clientX, event.clientY)
    }
    const onUp = () => {
      endBookPointer(gesture.current)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [gesture, gl])

  return null
}

export function ProjectBookScene({
  entries,
  reducedMotion,
  sectionVisible = true,
  preferFallback = false,
}: ProjectBookSceneProps) {
  const sheetCount = useMemo(() => bookSheetCount(entries.length), [entries])
  const maxPage = maxPageIndex(sheetCount)
  const [page, setPage] = useState(0)
  const [fallbackSpread, setFallbackSpread] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [resetNonce, setResetNonce] = useState(0)
  const [hintVisible, setHintVisible] = useState(true)

  const activityUntil = useRef(0)
  const bumpActivity = useCallback((ms?: number) => {
    const duration = ms ?? PROJECT_BOOK_CAMERA.orbitSettleMs
    activityUntil.current = Math.max(
      activityUntil.current,
      performance.now() + duration,
    )
  }, [])

  const requestReset = useCallback(() => {
    setResetNonce((n) => n + 1)
    setHintVisible(false)
    bumpActivity(PROJECT_BOOK_CAMERA.resetDurationMs + 100)
  }, [bumpActivity])

  const projectIndex = projectIndexForPage(page, entries.length)
  const active = projectIndex === null ? null : (entries[projectIndex] ?? null)
  const canShowDetails = detailsOpen && active !== null && page > 0

  useEffect(() => {
    bumpActivity(PROJECT_BOOK_CAMERA.pageSettleMs)
  }, [bumpActivity, page])

  useEffect(() => {
    warmupInitialBookTextures(entries)
  }, [entries])

  useEffect(() => {
    if (!sectionVisible) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      if (event.key === 'Escape') {
        if (detailsOpen) {
          event.preventDefault()
          setDetailsOpen(false)
          return
        }
        if (page > 0) {
          event.preventDefault()
          setPage(0)
        }
        return
      }
      if (detailsOpen) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        setPage((p) => Math.min(maxPage, p + 1))
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        setPage((p) => Math.max(0, p - 1))
      }
      if (event.key === 'Enter' || event.key === ' ') {
        if (page === 0) {
          event.preventDefault()
          setPage(1)
        }
      }
      if ((event.key === 'd' || event.key === 'D') && page > 0 && active) {
        event.preventDefault()
        setDetailsOpen(true)
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        requestReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, detailsOpen, maxPage, page, requestReset, sectionVisible])

  if (preferFallback) {
    return (
      <ProjectBookFallback
        entries={entries}
        spreadIndex={fallbackSpread}
        onSelect={setFallbackSpread}
      />
    )
  }

  return (
    <div className="project-book-scene">
      <Canvas
        className="project-book-scene__canvas"
        dpr={[1, PROJECT_BOOK_SCENE.dprMax]}
        shadows
        frameloop={!sectionVisible ? 'never' : 'demand'}
        camera={{
          position: [
            PROJECT_BOOK_CAMERA.defaultPosition.x,
            PROJECT_BOOK_CAMERA.defaultPosition.y,
            PROJECT_BOOK_CAMERA.defaultPosition.z,
          ],
          fov: PROJECT_BOOK_CAMERA.fov,
          near: 0.1,
          far: 80,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor(0x000000, 0)
          invalidate()
          bumpActivity(600)
        }}
      >
        <BookGestureProvider
          bumpActivity={bumpActivity}
          activityUntil={activityUntil}
        >
          <Suspense fallback={null}>
            <BookActivityLoop
              activityUntil={activityUntil}
              enabled={sectionVisible}
            />
            <BookOrbitRig
              resetNonce={resetNonce}
              reducedMotion={reducedMotion}
            />
            <BookLights />
            <group
              position-y={PROJECT_BOOK_SCENE.bookOffsetY}
              rotation-x={PROJECT_BOOK_SCENE.bookTiltX}
            >
              <ProjectBook
                entries={entries}
                page={page}
                reducedMotion={reducedMotion}
                onPageChange={setPage}
              />
            </group>
            <ContactShadows
              position={[0, -1.35, 0]}
              opacity={0.35}
              scale={8}
              blur={2.5}
              far={4}
              frames={1}
            />
            <GestureBridge />
          </Suspense>
        </BookGestureProvider>
      </Canvas>

      <div className="project-book-scene__chrome">
        {page === 0 && hintVisible ? (
          <p className="project-book-scene__hint" aria-hidden>
            {PROJECT_BOOK_META.exploreHint}
          </p>
        ) : null}

        <div className="project-book-scene__controls">
          {page === 0 ? (
            <button type="button" onClick={() => setPage(1)}>
              {PROJECT_BOOK_META.openLabel}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page <= 0}
              >
                {PROJECT_BOOK_META.prevLabel}
              </button>
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                disabled={!active}
              >
                {PROJECT_BOOK_META.detailsLabel}
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                disabled={page >= maxPage}
              >
                {PROJECT_BOOK_META.nextLabel}
              </button>
              <button type="button" onClick={() => setPage(0)}>
                {PROJECT_BOOK_META.closeLabel}
              </button>
            </>
          )}
          <button type="button" onClick={requestReset}>
            {PROJECT_BOOK_META.resetViewLabel}
          </button>
        </div>
      </div>

      {active ? (
        <ProjectDetailOverlay
          entry={active}
          open={canShowDetails}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}

      <ActiveSpreadAnnouncement entries={entries} page={page} />
    </div>
  )
}
