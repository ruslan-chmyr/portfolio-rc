import { useEffect, useMemo, useRef, useState } from 'react'
import { canUseWebGL, prefersReducedMotion } from '../../skills/lib/webglSupport'
import { useProjectBookPreloadTrigger } from '../hooks/useProjectBookPreloadTrigger'
import {
  preloadProjectBookScene,
  useProjectsBookModule,
} from '../hooks/useProjectsBookModule'
import { useProjectsNavOwned } from '../hooks/useProjectsNavOwned'
import { useProjectsScrollTransition } from '../hooks/useProjectsScrollTransition'
import { PROJECT_BOOK_SCENE } from '../model/projectBookConfig'
import { PROJECT_BOOK_ENTRIES } from '../model/projectBookData'
import { BookLoading } from './book/BookLoading'
import { ProjectBookFallback } from './book/ProjectBookFallback'
import '../styles/projects.css'
import '../styles/project-book.css'

export function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const scrollTargets = useMemo(
    () => ({
      sectionRef,
      pinRef,
      panelRef,
    }),
    [],
  )

  useProjectsScrollTransition(scrollTargets)

  const projectsReady = useProjectsNavOwned()
  const [webgl] = useState(() => canUseWebGL())
  const [reducedMotion] = useState(() => prefersReducedMotion())
  const [isMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(`(max-width: ${PROJECT_BOOK_SCENE.mobileMaxWidthPx}px)`)
        .matches,
  )

  const canUseBook = webgl && !isMobile
  const shouldPreload = useProjectBookPreloadTrigger(sectionRef, canUseBook)
  // Canvas mounts only after Projects owns the wipe — never during live Skills.
  const shouldMount = projectsReady && canUseBook

  const { status, Component: ProjectBookScene } =
    useProjectsBookModule(shouldPreload)

  // Extra idle warm in case the section observer hasn't fired yet.
  useEffect(() => {
    if (!canUseBook || shouldPreload) return
    const t = window.setTimeout(() => {
      void preloadProjectBookScene()
    }, 5000)
    return () => window.clearTimeout(t)
  }, [canUseBook, shouldPreload])

  const [fallbackSpread, setFallbackSpread] = useState(0)
  const showBookContent = projectsReady
  const show3d =
    shouldMount &&
    Boolean(ProjectBookScene) &&
    status !== 'error'

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="projects-section"
      aria-label="Selected Projects"
      data-projects-book={
        !showBookContent
          ? 'idle'
          : show3d
            ? 'webgl'
            : status === 'loading' || status === 'idle'
              ? 'loading'
              : 'fallback'
      }
    >
      <div ref={pinRef} className="projects-section__pin">
        <div ref={panelRef} className="projects-section__panel">
          {showBookContent ? (
            <div className="projects-section__book-slot">
              {show3d && ProjectBookScene ? (
                <ProjectBookScene
                  entries={PROJECT_BOOK_ENTRIES}
                  reducedMotion={reducedMotion}
                  sectionVisible={projectsReady}
                />
              ) : status === 'error' || isMobile || !webgl ? (
                <ProjectBookFallback
                  entries={PROJECT_BOOK_ENTRIES}
                  spreadIndex={fallbackSpread}
                  onSelect={setFallbackSpread}
                />
              ) : (
                <BookLoading />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
