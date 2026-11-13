import { PROJECT_BOOK_META } from '../../model/projectBookConfig'
import type { ProjectBookEntry } from '../../model/projectBookData'

type ProjectDetailOverlayProps = {
  entry: ProjectBookEntry
  open: boolean
  onClose: () => void
}

/** HTML editorial detail — keeps long copy out of canvas textures. */
export function ProjectDetailOverlay({
  entry,
  open,
  onClose,
}: ProjectDetailOverlayProps) {
  if (!open) return null

  return (
    <div
      className="project-book-detail"
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.title} details`}
    >
      <div className="project-book-detail__panel">
        <header className="project-book-detail__header">
          <p className="project-book-detail__index">{entry.number}</p>
          <button type="button" onClick={onClose}>
            {PROJECT_BOOK_META.detailsCloseLabel}
          </button>
        </header>
        <h3 className="project-book-detail__title">{entry.title}</h3>
        <p className="project-book-detail__summary">{entry.summary}</p>

        {entry.role ? (
          <p className="project-book-detail__block">
            <span>Focus</span>
            {entry.role}
          </p>
        ) : null}
        {entry.challenge ? (
          <p className="project-book-detail__block">
            <span>Challenge</span>
            {entry.challenge}
          </p>
        ) : null}
        {entry.solution ? (
          <p className="project-book-detail__block">
            <span>Solution</span>
            {entry.solution}
          </p>
        ) : null}
        {entry.results ? (
          <p className="project-book-detail__block">
            <span>Result</span>
            {entry.results}
          </p>
        ) : null}
        {entry.technologies.length ? (
          <ul className="project-book-detail__tech">
            {entry.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
