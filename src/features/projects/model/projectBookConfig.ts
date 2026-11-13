/** Cover + book chrome copy — keep years configurable without touching 3D code. */
export const PROJECT_BOOK_META = {
  coverTitle: 'SELECTED WORK',
  years: '2022 — 2026',
  openLabel: 'Open book',
  closeLabel: 'Close book',
  nextLabel: 'Next page',
  prevLabel: 'Previous page',
  detailsLabel: 'Project details',
  detailsCloseLabel: 'Close details',
  resetViewLabel: 'Reset view',
  zoomInLabel: 'Zoom in',
  zoomOutLabel: 'Zoom out',
  closeBookLabel: 'Close book',
  fullscreenEnterLabel: 'Enter fullscreen',
  fullscreenExitLabel: 'Exit fullscreen',
  a11yControlsLabel: 'Project book controls',
  zoomHint: 'Scroll to zoom',
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
  /** Lift so the open spread sits optically centered in the panel. */
  bookOffsetY: 0.22,
} as const

/** Orbit / zoom / framing — tunable without touching control components. */
export const PROJECT_BOOK_CAMERA = {
  fov: 40,
  /** Default spherical-ish Cartesian pose (before framing scale). */
  defaultPosition: { x: -1.05, y: 1.35, z: 3.8 },
  /** Orbit pivot aligned with the raised book visual center. */
  target: { x: 0, y: 0.18, z: 0 },
  /** Polar angle limits (rad) — avoid flipping under the book. */
  minPolar: 0.35,
  maxPolar: Math.PI * 0.72,
  minDistance: 2.4,
  maxDistance: 6.0,
  /**
   * Target fraction of viewport width for the open spread.
   * ~25% less than the prior 0.72 product close-up.
   */
  openWidthFill: 0.54,
  /**
   * Per-notch zoom scale (distance *= factor). Smaller = smoother scroll zoom.
   * Outward uses the factor; inward uses 1/factor.
   */
  zoomStepFactor: 1.025,
  /** Discrete toolbar zoom step (distance *= / /= factor). */
  toolbarZoomFactor: 1.14,
  toolbarZoomDurationMs: 320,
  /** Pointer movement (css px) before a gesture counts as orbit, not a click. */
  dragThresholdPx: 7,
  /** Horizontal swipe distance (css px) to commit a page turn. */
  swipeThresholdPx: 28,
  /** Keep demanding frames this long after a page turn (bone damp settle). */
  pageSettleMs: 1400,
  orbitSettleMs: 450,
  resetDurationMs: 700,
} as const
