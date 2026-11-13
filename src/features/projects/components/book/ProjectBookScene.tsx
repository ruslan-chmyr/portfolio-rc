import { Suspense, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useProjectBookController } from '../../hooks/useProjectBookController'
import { PROJECT_BOOK_META, PROJECT_BOOK_SCENE } from '../../model/projectBookConfig'
import type { ProjectBookEntry } from '../../model/projectBookData'
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
      <ambientLight intensity={0.42} />
      <directionalLight
        castShadow
        intensity={1.05}
        position={[2.8, 3.6, 2.4]}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0002}
      />
      <directionalLight intensity={0.28} position={[-2.2, 1.2, -1.8]} />
      <directionalLight intensity={0.2} position={[0.2, -1.4, 2.2]} />
    </>
  )
}

function BookInvalidatePulse({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => invalidate(), 32)
    return () => window.clearInterval(id)
  }, [active, invalidate])
  return null
}

function ActiveSpreadAnnouncement({
  entries,
  spreadIndex,
}: {
  entries: readonly ProjectBookEntry[]
  spreadIndex: number
}) {
  const active = entries[spreadIndex] ?? entries[0]
  if (!active) return null
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

export function ProjectBookScene({
  entries,
  reducedMotion,
  sectionVisible = true,
  preferFallback = false,
}: ProjectBookSceneProps) {
  const { state, open, close, turnNext, turnPrev, isInteractive } =
    useProjectBookController({
      spreadCount: entries.length,
      reducedMotion,
    })
  const [fallbackSpread, setFallbackSpread] = useState(0)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const active = entries[state.spreadIndex] ?? entries[0]

  const detailsAllowed = state.phase === 'open' || state.phase === 'turning'
  const showDetails = detailsOpen && detailsAllowed

  useEffect(() => {
    if (!isInteractive || !sectionVisible) return
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
        if (state.phase === 'open') {
          event.preventDefault()
          close()
        }
        return
      }
      if (detailsOpen) return
      if (state.phase !== 'open' && state.phase !== 'closed') return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        if (state.phase === 'closed') open()
        else turnNext()
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (state.phase === 'open') turnPrev()
      }
      if (event.key === 'Enter' || event.key === ' ') {
        if (state.phase === 'closed') {
          event.preventDefault()
          open()
        }
      }
      if ((event.key === 'd' || event.key === 'D') && state.phase === 'open') {
        event.preventDefault()
        setDetailsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    close,
    detailsOpen,
    isInteractive,
    open,
    sectionVisible,
    state.phase,
    turnNext,
    turnPrev,
  ])

  if (preferFallback) {
    return (
      <ProjectBookFallback
        entries={entries}
        spreadIndex={fallbackSpread}
        onSelect={setFallbackSpread}
      />
    )
  }

  const animating =
    state.phase === 'opening' ||
    state.phase === 'closing' ||
    state.phase === 'turning'

  return (
    <div className="project-book-scene">
      <Canvas
        className="project-book-scene__canvas"
        dpr={[1, PROJECT_BOOK_SCENE.dprMax]}
        shadows
        frameloop={!sectionVisible ? 'never' : 'demand'}
        camera={{
          position: [
            PROJECT_BOOK_SCENE.closedCamera.x,
            PROJECT_BOOK_SCENE.closedCamera.y,
            PROJECT_BOOK_SCENE.closedCamera.z,
          ],
          fov: 34,
          near: 0.1,
          far: 40,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor(0x000000, 0)
          invalidate()
        }}
      >
        <Suspense fallback={null}>
          <BookInvalidatePulse active={sectionVisible && animating} />
          <BookLights />
          <ProjectBook
            entries={entries}
            state={state}
            reducedMotion={reducedMotion}
            onOpen={open}
            onTurnNext={turnNext}
            onTurnPrev={turnPrev}
            onRequestDetails={() => setDetailsOpen(true)}
          />
          <ContactShadows
            position={[0, -1.05, 0]}
            opacity={0.38}
            scale={7}
            blur={2.6}
            far={3.5}
            frames={1}
          />
        </Suspense>
      </Canvas>

      <div className="project-book-scene__chrome">
        {state.phase === 'closed' ? (
          <p className="project-book-scene__hint" aria-hidden>
            {PROJECT_BOOK_META.exploreHint}
          </p>
        ) : null}

        <div className="project-book-scene__controls">
          {state.phase === 'closed' ? (
            <button type="button" onClick={open}>
              {PROJECT_BOOK_META.openLabel}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={turnPrev}
                disabled={state.phase !== 'open' || state.spreadIndex <= 0}
              >
                {PROJECT_BOOK_META.prevLabel}
              </button>
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                disabled={state.phase !== 'open'}
              >
                {PROJECT_BOOK_META.detailsLabel}
              </button>
              <button
                type="button"
                onClick={turnNext}
                disabled={
                  state.phase !== 'open' ||
                  state.spreadIndex >= entries.length - 1
                }
              >
                {PROJECT_BOOK_META.nextLabel}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={state.phase !== 'open'}
              >
                {PROJECT_BOOK_META.closeLabel}
              </button>
            </>
          )}
        </div>
      </div>

      {active ? (
        <ProjectDetailOverlay
          entry={active}
          open={showDetails}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}

      <ActiveSpreadAnnouncement
        entries={entries}
        spreadIndex={state.spreadIndex}
      />
    </div>
  )
}
