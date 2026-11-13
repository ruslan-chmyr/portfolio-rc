import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import type { Group } from 'three'
import {
  bookSheetCount,
  maxPageIndex,
  projectIndexForPage,
} from '../../lib/buildBookSheets'
import {
  clearSheetFaceTextureCache,
  releaseWarmupBookTextures,
  warmupInitialBookTextures,
} from '../../lib/sheetFaceTexture'
import { isBookFullySettled } from '../../lib/bookPageSettle'
import {
  PROJECT_BOOK_CAMERA,
  PROJECT_BOOK_META,
  PROJECT_BOOK_SCENE,
} from '../../model/projectBookConfig'
import type { ProjectBookEntry } from '../../model/projectBookData'
import { BookActivityLoop } from './BookActivityLoop'
import { BookGestureProvider } from './BookGestureContext'
import { BookOrbitRig } from './BookOrbitRig'
import { BookPointerOwnership } from './BookPointerOwnership'
import { BookToolbar } from './BookToolbar'
import { ProjectBook } from './ProjectBook'
import { ProjectBookFallback } from './ProjectBookFallback'
import '../../styles/book-toolbar.css'

export type ProjectBookSceneProps = {
  entries: readonly ProjectBookEntry[]
  reducedMotion: boolean
  sectionVisible?: boolean
  preferFallback?: boolean
}

function BookLights() {
  return (
    <>
      <ambientLight intensity={0.42} color="#c8d6ff" />
      <directionalLight
        castShadow
        intensity={1.85}
        color="#e8eeff"
        position={[2.2, 5.2, 2.4]}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight intensity={0.45} color="#7aa7ff" position={[-2.8, 1.4, -1.2]} />
      <directionalLight intensity={0.22} color="#52ffa5" position={[1.5, 2.2, -2.5]} />
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

/** Always visually hidden — keyboard / screen-reader page nav. */
function BookA11yControls({
  page,
  maxPage,
  onOpen,
  onClose,
  onPrev,
  onNext,
}: {
  page: number
  maxPage: number
  onOpen: () => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="project-book-scene__a11y">
      <p id="project-book-a11y-label">{PROJECT_BOOK_META.a11yControlsLabel}</p>
      {page === 0 ? (
        <button type="button" onClick={onOpen}>
          {PROJECT_BOOK_META.openLabel}
        </button>
      ) : (
        <>
          <button type="button" onClick={onPrev} disabled={page <= 0}>
            {PROJECT_BOOK_META.prevLabel}
          </button>
          <button type="button" onClick={onNext} disabled={page >= maxPage}>
            {PROJECT_BOOK_META.nextLabel}
          </button>
          <button type="button" onClick={onClose}>
            {PROJECT_BOOK_META.closeLabel}
          </button>
        </>
      )}
    </div>
  )
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
  const [visualPage, setVisualPage] = useState(0)
  const [bonesSettled, setBonesSettled] = useState(false)
  const [fallbackSpread, setFallbackSpread] = useState(0)
  const [resetNonce, setResetNonce] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const bookRootRef = useRef<Group>(null)
  const sceneRootRef = useRef<HTMLDivElement>(null)
  const closingLock = useRef(false)
  const invalidateSlot = useRef<(() => void) | null>(null)
  const onVisualPageChange = useCallback((next: number) => {
    setVisualPage(next)
  }, [])
  const onBonesSettledChange = useCallback((settled: boolean) => {
    setBonesSettled(settled)
  }, [])

  const activityUntil = useRef(0)
  const bumpActivity = useCallback((ms?: number) => {
    const duration = ms ?? PROJECT_BOOK_CAMERA.orbitSettleMs
    activityUntil.current = Math.max(
      activityUntil.current,
      performance.now() + duration,
    )
    invalidateSlot.current?.()
  }, [])

  const requestReset = useCallback(() => {
    setResetNonce((n) => n + 1)
    bumpActivity(PROJECT_BOOK_CAMERA.resetDurationMs + 100)
  }, [bumpActivity])

  const closeBook = useCallback(() => {
    if (page <= 0 || closingLock.current) return
    closingLock.current = true
    setPage(0)
  }, [page])

  const toggleFullscreen = useCallback(async () => {
    const root = sceneRootRef.current
    if (!root) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await root.requestFullscreen()
      }
    } catch {
      // Browser may reject without user gesture or when unsupported.
    }
  }, [])

  useEffect(() => {
    // Unlock Close Book only when page index, delayed visuals, and bones agree.
    if (
      page === 0 &&
      isBookFullySettled({
        targetPage: page,
        visualPage,
        bonesSettled,
      })
    ) {
      closingLock.current = false
    }
  }, [bonesSettled, page, visualPage])

  useEffect(() => {
    bumpActivity(PROJECT_BOOK_CAMERA.pageSettleMs)
  }, [bumpActivity, page])

  useEffect(() => {
    releaseWarmupBookTextures()
    warmupInitialBookTextures(entries)
  }, [entries])

  useEffect(
    () => () => {
      releaseWarmupBookTextures()
      clearSheetFaceTextureCache()
    },
    [],
  )

  useEffect(() => {
    const onFs = () => {
      const active = document.fullscreenElement === sceneRootRef.current
      setFullscreen(active)
      bumpActivity(400)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [bumpActivity])

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
      // Do not steal arrows/shortcuts from unrelated focused controls.
      if (
        target &&
        target.closest('a, button, select, [role="slider"]') &&
        sceneRootRef.current &&
        !sceneRootRef.current.contains(target)
      ) {
        return
      }
      // Let the browser exit fullscreen on Escape first.
      if (event.key === 'Escape') {
        if (document.fullscreenElement) return
        if (page > 0) {
          event.preventDefault()
          closeBook()
        }
        return
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        if (closingLock.current) return
        event.preventDefault()
        setPage((p) => Math.min(maxPage, p + 1))
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        if (closingLock.current) return
        event.preventDefault()
        setPage((p) => Math.max(0, p - 1))
      }
      if (event.key === 'Enter' || event.key === ' ') {
        if (page === 0) {
          event.preventDefault()
          setPage(1)
        }
      }
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        requestReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeBook, maxPage, page, requestReset, sectionVisible, visualPage])

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
    <div
      ref={sceneRootRef}
      className="project-book-scene"
      data-fullscreen={fullscreen ? 'true' : 'false'}
      role="region"
      aria-label="Interactive project book"
    >
      <BookGestureProvider
        bumpActivity={bumpActivity}
        activityUntil={activityUntil}
        invalidateSlot={invalidateSlot}
      >
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
            invalidateSlot.current = invalidate
            invalidate()
            bumpActivity(600)
          }}
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
              ref={bookRootRef}
              position-y={PROJECT_BOOK_SCENE.bookOffsetY}
              rotation-x={PROJECT_BOOK_SCENE.bookTiltX}
            >
              <ProjectBook
                entries={entries}
                page={page}
                reducedMotion={reducedMotion}
                onPageChange={(next) => {
                  if (closingLock.current) return
                  setPage(next)
                }}
                onVisualPageChange={onVisualPageChange}
                onBonesSettledChange={onBonesSettledChange}
              />
            </group>
            <ContactShadows
              position={[0, -1.05, 0]}
              opacity={0.42}
              scale={9}
              blur={2.8}
              far={4.5}
              frames={1}
              color="#0b1240"
            />
            <BookPointerOwnership bookRootRef={bookRootRef} />
          </Suspense>
        </Canvas>

        <BookToolbar
          page={page}
          fullscreen={fullscreen}
          onResetView={requestReset}
          onCloseBook={closeBook}
          onToggleFullscreen={() => {
            void toggleFullscreen()
          }}
        />

        <BookA11yControls
          page={page}
          maxPage={maxPage}
          onOpen={() => setPage(1)}
          onClose={closeBook}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
        />

        <ActiveSpreadAnnouncement entries={entries} page={page} />
      </BookGestureProvider>
    </div>
  )
}
