/** Cover + book chrome copy — keep years configurable without touching 3D code. */
export const PROJECT_BOOK_META = {
  coverTitle: 'SELECTED WORK',
  years: '2022 — 2026',
  exploreHint: 'Click to explore',
  openLabel: 'Open project book',
  closeLabel: 'Close project book',
  nextLabel: 'Next project',
  prevLabel: 'Previous project',
} as const

/** Physical + framing defaults for the R3F book (world units). */
export const PROJECT_BOOK_SCENE = {
  pageWidth: 1.35,
  pageHeight: 1.9,
  pageSegments: 24,
  coverThickness: 0.04,
  pageThickness: 0.012,
  openSpreadGap: 0.02,
  flipDurationMs: 780,
  openDurationMs: 1100,
  mobileMaxWidthPx: 700,
  dprMax: 1.75,
} as const
