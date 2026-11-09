export const INTRO_POINTER = {
  simGrid: 128,
  marginPx: 130,
  padXFactor: 0.32,
  padYFactor: 0.36,
  proximityCutoff: 0.02,
  proximityMin: 0.04,
  boundsX: [-0.32, 1.32] as const,
  boundsY: [-0.38, 1.38] as const,
  clampX: [-0.18, 1.18] as const,
  clampY: [-0.22, 1.22] as const,
  followRate: 115,
  presenceDecay: 6,
  presenceActiveSeconds: 0.55,
  presenceProximityScale: 0.55,
  presenceMin: 0.08,
  impulsePresenceMin: 0.08,
  impulseD60Min: 1e-5,
  maxFrameDistanceFactor: 0.09,
  impulseGain: 0.52,
  impulseKDivisor: 0.3,
  impulseKScale: 1800,
  strengthTarget: 1.45,
  strengthDuration: 0.65,
} as const

export const INTRO_SCROLL = {
  // One viewport plus some travel for precise, reversible trackpad scrubbing.
  distanceViewportFactor: 1.7,
  minDistancePx: 720,
  keyboardStep: 0.09,
} as const

export const INTRO_TRANSITION = {
  scrollBloomStart: 0.12,
  canvasFadeStart: 0.80,
  canvasFadeDuration: 0.28,
  bloomDelayWithWebGl: 0.24,
  bloomDuration: 1.35,
  bloomDurationReduced: 0.45,
  markScale: 1.9,
  bloomPath:
    'M 300 105 C 334 94 362 116 365 150 C 383 183 358 216 321 221 C 285 241 240 211 239 174 C 219 139 258 104 300 105 Z',
} as const
