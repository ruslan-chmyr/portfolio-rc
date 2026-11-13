import { useMemo, useRef } from 'react'
import { useProjectsScrollTransition } from '../hooks/useProjectsScrollTransition'
import '../styles/projects.css'

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

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="projects-section"
      aria-label="Selected Projects"
    >
      <div ref={pinRef} className="projects-section__pin">
        <div ref={panelRef} className="projects-section__panel" />
      </div>
    </section>
  )
}
