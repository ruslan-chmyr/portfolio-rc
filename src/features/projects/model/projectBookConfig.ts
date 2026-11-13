/** Cover + book chrome copy — keep years configurable without touching 3D code. */
export const PROJECT_BOOK_META = {
  coverTitle: 'SELECTED WORK',
  years: '2022 — 2026',
  exploreHint: 'Click a page to turn',
  openLabel: 'Open',
  closeLabel: 'Close',
  nextLabel: 'Next',
  prevLabel: 'Prev',
  detailsLabel: 'Details',
  detailsCloseLabel: 'Close details',
} as const

/**
 * Physical page dims aligned with the reference SkinnedMesh book slider
 * (PAGE_WIDTH / HEIGHT / DEPTH / SEGMENTS).
 */
export const PROJECT_BOOK_SCENE = {
  pageWidth: 1.28,
  pageHeight: 1.71,
  pageDepth: 0.003,
  pageSegments: 30,
  mobileMaxWidthPx: 700,
  dprMax: 1.6,
  /** Closed three-quarter presentation (no OrbitControls). */
  closedCamera: { x: 0.15, y: 1.35, z: 3.9 },
  openCamera: { x: 0, y: 0.85, z: 3.6 },
} as const
