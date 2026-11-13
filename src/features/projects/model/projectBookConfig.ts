/** Cover + book chrome copy — keep years configurable without touching 3D code. */
export const PROJECT_BOOK_META = {
  coverTitle: 'SELECTED WORK',
  years: '2022 — 2026',
  exploreHint: 'Click to explore',
  openLabel: 'Open',
  closeLabel: 'Close',
  nextLabel: 'Next',
  prevLabel: 'Prev',
  detailsLabel: 'Details',
  detailsCloseLabel: 'Close details',
} as const

/**
 * Physical book + camera framing (world units).
 * Cover/paper thickness are intentional — closed state must read as a volume.
 */
export const PROJECT_BOOK_SCENE = {
  pageWidth: 1.12,
  pageHeight: 1.52,
  pageSegments: 28,
  coverThickness: 0.028,
  paperBlockDepth: 0.055,
  spineWidth: 0.048,
  coverInset: 0.012,
  /** Cover opens just past flat so the spread breathes. */
  coverOpenAngle: Math.PI * 0.98,
  flipDurationMs: 900,
  openDurationMs: 1400,
  mobileMaxWidthPx: 700,
  dprMax: 1.6,
  /** Closed three-quarter pose */
  closedPose: {
    rotX: -0.38,
    rotY: 0.62,
    rotZ: -0.06,
    posY: -0.02,
  },
  /** Open reading pose — flatter, spine-centered */
  openPose: {
    rotX: -0.12,
    rotY: 0.02,
    rotZ: 0,
    posY: 0.04,
  },
  closedCamera: { x: 1.05, y: 0.55, z: 3.55 },
  openCamera: { x: 0, y: 0.22, z: 3.85 },
} as const
