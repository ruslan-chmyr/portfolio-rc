/** Coordinated Skills scene entrance (~1s total with overlap). */
export const SKILLS_ENTRANCE = {
  duration: 1.05,
  ease: 'power2.out',
  chrome: {
    y: 22,
    duration: 0.42,
    at: 0,
    stagger: 0.06,
  },
  keyboard: {
    y: 28,
    duration: 0.55,
    at: 0.18,
  },
  stories: {
    y: 18,
    x: 16,
    duration: 0.55,
    at: 0.36,
  },
} as const
