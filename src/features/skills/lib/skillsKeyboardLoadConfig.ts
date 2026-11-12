/**
 * Viewport gate for deferring the Skills Three.js / R3F keyboard chunk.
 * Root margin preloads while the user is still in About / approaching Skills.
 */
export const SKILLS_KEYBOARD_LOAD = {
  rootMargin: '55% 0px 30% 0px',
  threshold: 0.01,
} as const
