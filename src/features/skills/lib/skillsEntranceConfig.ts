/** Coordinated Skills scene entrance (~1s total with overlap). */
export const SKILLS_ENTRANCE = {
  duration: 0.95,
  ease: 'power2.out',
  chrome: {
    y: 16,
    duration: 0.4,
    at: 0,
    stagger: 0.05,
  },
  keyboard: {
    y: 18,
    duration: 0.5,
    at: 0.12,
  },
  stories: {
    y: 18,
    x: 12,
    duration: 0.5,
    /* Reveal with the keyboard so the grid isn't half-empty mid-entrance. */
    at: 0.12,
  },
} as const
