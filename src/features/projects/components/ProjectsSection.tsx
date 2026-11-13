import { useMemo, useRef, useState } from 'react'
import { canUseWebGL, prefersReducedMotion } from '../../skills/lib/webglSupport'
import { useProjectsBookModule } from '../hooks/useProjectsBookModule'
import { useProjectsNavOwned } from '../hooks/useProjectsNavOwned'
import { useProjectsScrollTransition } from '../hooks/useProjectsScrollTransition'
import { PROJECT_BOOK_SCENE } from '../model/projectBookConfig'
import { PROJECT_BOOK_ENTRIES } from '../model/projectBookData'
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

  // Mount 3D only after the blue wipe owns the scene — never while Skills is live.
  const shouldLoadBook = projectsReady && webgl && !isMobile
  const { status, Component: ProjectBookScene } = useProjectsBookModule(shouldLoadBook)

  const [fallbackSpread, setFallbackSpread] = useState(0)
  const showBookContent = projectsReady
  const show3d =
    Boolean(ProjectBookScene) &&
    !isMobile &&
    webgl &&
    status !== 'error'

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="projects-section"
      aria-label="Selected Projects"
      data-projects-book={
        !showBookContent ? 'idle' : show3d ? 'webgl' : 'fallback'
      }
    >
      <div ref={pinRef} className="projects-section__pin">
        {/* Empty blue panel until wipe ownership — Skills handoff stays intact. */}
        <div ref={panelRef} className="projects-section__panel">
          {showBookContent ? (
            <div className="projects-section__book-slot">
              {show3d && ProjectBookScene ? (
                <ProjectBookScene
                  entries={PROJECT_BOOK_ENTRIES}
                  reducedMotion={reducedMotion}
                  sectionVisible={projectsReady}
                />
              ) : (
                <ProjectBookFallback
                  entries={PROJECT_BOOK_ENTRIES}
                  spreadIndex={fallbackSpread}
                  onSelect={setFallbackSpread}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
