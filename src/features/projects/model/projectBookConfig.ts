/** Cover + book chrome copy — keep years configurable without touching 3D code. */
export const PROJECT_BOOK_META = {
  coverTitle: 'SELECTED WORK',
  years: '2022 — 2026',
  exploreHint: 'Drag to orbit · click a page to turn',
  openLabel: 'Open',
  closeLabel: 'Close',
  nextLabel: 'Next',
  prevLabel: 'Prev',
  detailsLabel: 'Details',
  detailsCloseLabel: 'Close details',
  resetViewLabel: 'Reset view',
  zoomHint: 'Ctrl + scroll to zoom',
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
  /** Presentation tilt on the book group (not camera Float). */
  bookTiltX: -Math.PI / 4,
  bookOffsetY: -0.12,
} as const

/** Orbit / zoom / framing — tunable without touching control components. */
export const PROJECT_BOOK_CAMERA = {
  fov: 40,
  /** Default spherical-ish Cartesian pose (before framing scale). */
  defaultPosition: { x: -0.85, y: 1.05, z: 3.05 },
  target: { x: 0, y: -0.05, z: 0 },
  /** Polar angle limits (rad) — avoid flipping under the book. */
  minPolar: 0.35,
  maxPolar: Math.PI * 0.72,
  minDistance: 2.4,
  maxDistance: 5.0,
  /** Target fraction of viewport width occupied by the open spread. */
  openWidthFill: 0.72,
  /** Pointer movement (css px) before a gesture counts as orbit, not a click. */
  dragThresholdPx: 7,
  /** Keep demanding frames this long after a page turn (bone damp settle). */
  pageSettleMs: 1400,
  orbitSettleMs: 450,
  resetDurationMs: 700,
} as const
