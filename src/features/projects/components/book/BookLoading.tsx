/** Quiet placeholder while the prefetched chunk finishes — no visible chrome. */
export function BookLoading() {
  return (
    <div
      className="project-book-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading project book"
    />
  )
}
