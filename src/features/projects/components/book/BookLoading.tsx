import { PROJECT_BOOK_META } from '../../model/projectBookConfig'

/** Quiet placeholder while the prefetched chunk finishes — not the full 2D fallback. */
export function BookLoading() {
  return (
    <div className="project-book-loading" role="status" aria-live="polite">
      <p className="project-book-loading__label">{PROJECT_BOOK_META.coverTitle}</p>
      <p className="project-book-loading__meta">Preparing book…</p>
    </div>
  )
}
