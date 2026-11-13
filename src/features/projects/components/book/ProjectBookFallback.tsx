import { PROJECT_BOOK_META } from '../../model/projectBookConfig'
import type { ProjectBookEntry } from '../../model/projectBookData'

type ProjectBookFallbackProps = {
  entries: readonly ProjectBookEntry[]
  spreadIndex: number
  onSelect: (index: number) => void
}

/** Accessible 2D reading surface — also the mobile / no-WebGL path. */
export function ProjectBookFallback({
  entries,
  spreadIndex,
  onSelect,
}: ProjectBookFallbackProps) {
  const active = entries[spreadIndex] ?? entries[0]
  if (!active) {
    return (
      <div className="project-book-fallback">
        <p className="project-book-fallback__empty">Projects coming soon.</p>
      </div>
    )
  }

  return (
    <div className="project-book-fallback" aria-label={PROJECT_BOOK_META.coverTitle}>
      <header className="project-book-fallback__header">
        <p className="project-book-fallback__meta">
          {PROJECT_BOOK_META.coverTitle}
          <span aria-hidden> · </span>
          {PROJECT_BOOK_META.years}
        </p>
        <p className="project-book-fallback__count" aria-live="polite">
          {active.number} / {String(entries.length).padStart(2, '0')}
        </p>
      </header>

      <article className="project-book-fallback__spread">
        <div className="project-book-fallback__visual">
          <img src={active.coverImage} alt="" />
        </div>
        <div className="project-book-fallback__copy">
          <h3 className="project-book-fallback__title">{active.title}</h3>
          <p className="project-book-fallback__summary">{active.summary}</p>
          {active.role ? (
            <p className="project-book-fallback__block">
              <span>Focus</span>
              {active.role}
            </p>
          ) : null}
          {active.challenge ? (
            <p className="project-book-fallback__block">
              <span>Challenge</span>
              {active.challenge}
            </p>
          ) : null}
          {active.solution ? (
            <p className="project-book-fallback__block">
              <span>Solution</span>
              {active.solution}
            </p>
          ) : null}
          {active.results ? (
            <p className="project-book-fallback__block">
              <span>Result</span>
              {active.results}
            </p>
          ) : null}
          {active.technologies.length ? (
            <ul className="project-book-fallback__tech">
              {active.technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>

      <nav className="project-book-fallback__nav" aria-label="Project spreads">
        <button
          type="button"
          disabled={spreadIndex <= 0}
          onClick={() => onSelect(spreadIndex - 1)}
        >
          Previous
        </button>
        <ol>
          {entries.map((entry, index) => (
            <li key={entry.id}>
              <button
                type="button"
                aria-current={index === spreadIndex ? 'true' : undefined}
                onClick={() => onSelect(index)}
              >
                {entry.number}
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled={spreadIndex >= entries.length - 1}
          onClick={() => onSelect(spreadIndex + 1)}
        >
          Next
        </button>
      </nav>
    </div>
  )
}
